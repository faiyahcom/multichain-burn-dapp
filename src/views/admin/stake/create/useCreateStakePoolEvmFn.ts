import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider, type Log } from "ethers";
import {
  getContractStakeFactory,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { DEFAULT_NATIVE_DECIMALS, ZERO_ADDRESS } from "@/config/constant";
import { getDecimalsTokenNativeByChainId } from "@/config/networks";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { assertSufficientNativeBalanceForTransaction } from "@/utils/helpers/evm-gas";
import { isNativeToken } from "@/hooks/useTokenBalance";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";

export type CreateStakePoolEvmParams = {
  stakingToken: string;
  rewardToken: string;
  startTime: Date;
  endTime: Date;
  /** Human-readable min staking amount */
  minStakingAmount: string;
  /** Human-readable max staking amount (0 = unlimited) */
  maxStakingAmount: string;
  /** Human-readable total staking cap (0 = unlimited) */
  stakingLimit: string;
  /** Human-readable reward budget to deposit after creation */
  budget: string;
  /** Lock-up duration in days → unstakeDelay (seconds) */
  lockDuration: number;
  /** Interest start delay in days → interestDelay (seconds) */
  interestStartDelay: number;
  /** Interest accrual duration in days; null = infinite (uint256 max) */
  interestAccrualDuration: number | null;
  /** Claim start delay in days → claimDelay (seconds) */
  claimStartDelay: number;
  /** APR as plain percentage, e.g. 12 for 12% — stored as bps (×100) on-chain */
  apr: number;
};

const normalizeAddress = (address: string) =>
  isNativeToken(address) ? ZERO_ADDRESS : ethers.getAddress(address);

const daysToSeconds = (days: number) => BigInt(Math.round(days * 86400));

export const useCreateStakePoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const createPool = useCallback(
    async (params: CreateStakePoolEvmParams): Promise<string | undefined> => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const contract = getContractStakeFactory(signer);
        const contractAddress = await contract.getAddress();

        const rewardIsNative = isNativeToken(params.rewardToken);
        const stakingIsNative = isNativeToken(params.stakingToken);

        // 1. Resolve decimals
        const chainId = Number((await provider.getNetwork()).chainId);
        const nativeDecimals =
          getDecimalsTokenNativeByChainId(chainId)?.decimals ??
          DEFAULT_NATIVE_DECIMALS;

        let rewardDecimals = nativeDecimals;
        if (!rewardIsNative) {
          const rewardToken = getERC20Contract(params.rewardToken, signer);
          rewardDecimals = Number(await rewardToken.decimals());
        }

        let stakingDecimals = nativeDecimals;
        if (!stakingIsNative) {
          const stakingToken = getERC20Contract(params.stakingToken, signer);
          stakingDecimals = Number(await stakingToken.decimals());
        }

        // 2. Parse amounts
        const minStakePerTx = ethers.parseUnits(
          params.minStakingAmount || "0",
          stakingDecimals,
        );
        const maxStakePerTx = ethers.parseUnits(
          params.maxStakingAmount || "0",
          stakingDecimals,
        );
        const stakingLimit = ethers.parseUnits(
          params.stakingLimit || "0",
          stakingDecimals,
        );
        const budgetAmount = ethers.parseUnits(
          params.budget || "0",
          rewardDecimals,
        );

        // 3. APR and durations
        const aprBps = BigInt(Math.round(params.apr * DECIMAL_FEE_PERCENT));

        const interestTime =
          params.interestAccrualDuration === null
            ? ethers.MaxUint256 // infinite accrual until unstake
            : daysToSeconds(params.interestAccrualDuration);

        // 4. Build payload
        const payload = {
          stakingToken: normalizeAddress(params.stakingToken),
          rewardToken: normalizeAddress(params.rewardToken),
          startTime: BigInt(Math.floor(params.startTime.getTime() / 1000)),
          endTime: BigInt(Math.floor(params.endTime.getTime() / 1000)),
          minStakePerTx,
          maxStakePerTx,
          stakingLimit,
          unstakeDelay: daysToSeconds(params.lockDuration),
          interestDelay: daysToSeconds(params.interestStartDelay),
          interestTime,
          claimDelay: daysToSeconds(params.claimStartDelay),
          apr: aprBps,
        };

        // 5. Gas check and create pool (no creation fee for staking pools)
        await assertSufficientNativeBalanceForTransaction({
          provider,
          address: userAddress,
          txValue: 0n,
          estimateGas: () => contract.createPool.estimateGas(payload, { value: 0n }),
        });

        const createTx = await contract.createPool(payload, { value: 0n });
        const createReceipt = await createTx.wait();

        toast.success("Staking pool created!", {
          description: `Tx: ${createReceipt.hash}`,
        });

        // 6. Parse pool address from PoolCreated event
        const poolCreatedLog = createReceipt?.logs?.find((log: Log) => {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            return parsed?.name === "PoolCreated";
          } catch {
            return false;
          }
        });

        const poolAddress: string | undefined =
          poolCreatedLog &&
          contract.interface.parseLog({
            topics: poolCreatedLog.topics as string[],
            data: poolCreatedLog.data,
          })?.args?.pool;

        if (!poolAddress) {
          throw new Error("Could not determine pool address from transaction");
        }

        // 7. Deposit reward budget (if provided)
        if (budgetAmount > 0n) {
          if (rewardIsNative) {
            await assertSufficientNativeBalanceForTransaction({
              provider,
              address: userAddress,
              txValue: budgetAmount,
              estimateGas: () =>
                contract.depositReward.estimateGas(poolAddress, budgetAmount, {
                  value: budgetAmount,
                }),
            });

            const depositTx = await contract.depositReward(
              poolAddress,
              budgetAmount,
              { value: budgetAmount },
            );
            await depositTx.wait();
          } else {
            const rewardTokenContract = getERC20Contract(
              params.rewardToken,
              signer,
            );

            const rewardBalance: bigint = await rewardTokenContract.balanceOf(
              userAddress,
            );
            if (rewardBalance < budgetAmount) {
              throw new Error(
                `Insufficient reward token balance. Required: ${ethers.formatUnits(budgetAmount, rewardDecimals)}`,
              );
            }

            const currentAllowance: bigint = await rewardTokenContract.allowance(
              userAddress,
              contractAddress,
            );
            if (currentAllowance < budgetAmount) {
              const approveTx = await rewardTokenContract.approve(
                contractAddress,
                budgetAmount,
              );
              await approveTx.wait();
            }

            const depositTx = await contract.depositReward(
              poolAddress,
              budgetAmount,
              { value: 0n },
            );
            await depositTx.wait();
          }
        }

        return poolAddress;
      } catch (error: unknown) {
        toast.error("Create staking pool failed", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  const submitPool = useCallback(
    async (poolAddress: string): Promise<void> => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const contract = getContractStakeFactory(signer);

        const tx = await contract.submitPool(poolAddress);
        await tx.wait();

        toast.success("Staking pool submitted for review!", {
          description: `Tx: ${tx.hash}`,
        });
      } catch (error: unknown) {
        toast.error("Submit staking pool failed", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  return { createPool, submitPool };
};
