import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
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
  /** Pool name (max 31 UTF-8 bytes) */
  name: string;
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
  /** Human-readable initial reward to deposit at creation */
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
  /** Whether to submit the pool immediately after creation */
  autoSubmit: boolean;
  /** When true, interest calculation stops at the pool's end time */
  stopAccrualAtPoolEnd: boolean;
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
        const initialReward = ethers.parseUnits(
          params.budget || "0",
          rewardDecimals,
        );

        // 3. APR and durations
        const aprBps = BigInt(Math.round(params.apr * DECIMAL_FEE_PERCENT));

        const interestTime =
          params.interestAccrualDuration === null ||
            params.interestAccrualDuration <= 0
            ? 0n
            : daysToSeconds(params.interestAccrualDuration);

        // 4. Build payload
        const payload = {
          name: ethers.encodeBytes32String(params.name.slice(0, 31)),
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
          initialReward,
          submitPool: params.autoSubmit,
          apr: aprBps,
          stopInterestAtPoolEnd: params.stopAccrualAtPoolEnd,
        };

        console.log("Creating stake pool with payload:", payload);

        // 5. ERC20 approve if initial reward is provided and reward is not native
        if (initialReward > 0n && !rewardIsNative) {
          const rewardTokenContract = getERC20Contract(
            params.rewardToken,
            signer,
          );

          const rewardBalance: bigint =
            await rewardTokenContract.balanceOf(userAddress);
          if (rewardBalance < initialReward) {
            throw new Error(
              `Insufficient reward token balance. Required: ${ethers.formatUnits(initialReward, rewardDecimals)}`,
            );
          }

          const currentAllowance: bigint = await rewardTokenContract.allowance(
            userAddress,
            contractAddress,
          );
          if (currentAllowance < initialReward) {
            const approveTx = await rewardTokenContract.approve(
              contractAddress,
              initialReward,
            );
            await approveTx.wait();
          }
        }

        // 6. Gas check and create pool (initialReward deposited atomically)
        const nativeValue = rewardIsNative ? initialReward : 0n;
        await assertSufficientNativeBalanceForTransaction({
          provider,
          address: userAddress,
          txValue: nativeValue,
          estimateGas: () =>
            contract.createPool.estimateGas(payload, { value: nativeValue }),
        });

        const createTx = await contract.createPool(payload, {
          value: nativeValue,
        });
        const createReceipt = await createTx.wait();

        toast.success(
          params.autoSubmit
            ? "Staking pool created & submitted!"
            : "Staking pool saved as draft!",
          {
            description: `Tx: ${createReceipt.hash}`,
          },
        );

        // 7. Parse pool address from StakingPoolCreated event
        const poolCreatedLog = createReceipt?.logs
          ?.map((log: { topics: readonly string[]; data: string }) => {
            try {
              return contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
            } catch {
              return null;
            }
          })
          .find(
            (parsed: { name: string }) => parsed?.name === "StakingPoolCreated",
          );

        const poolAddress: string | undefined = poolCreatedLog?.args?.pool;

        if (!poolAddress) {
          throw new Error("Could not determine pool address from transaction");
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

  return { createPool };
};
