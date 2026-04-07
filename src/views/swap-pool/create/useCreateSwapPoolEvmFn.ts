import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider, type Log } from "ethers";
import {
  getERC20Contract,
  getContractSwapFactory,
} from "@/web3/contracts/multichainBurnContractEVM";
import { DEFAULT_NATIVE_DECIMALS, ZERO_ADDRESS } from "@/config/constant";
import { getDecimalsTokenNativeByChainId } from "@/config/networks";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { assertSufficientNativeBalanceForTransaction } from "@/utils/helpers/evm-gas";
import { normalizeRatioToIntegers } from "@/utils/helpers/ratio";

const AssetType = {
  ERC20: 0,
  NATIVE: 3,
} as const;

const isNativeToken = (address: string) => {
  return (
    !address || address === ZERO_ADDRESS || address.toLowerCase() === "native"
  );
};

export const useCreateSwapPoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const createPool = useCallback(
    async ({
      poolName,
      tokenReward,
      tokenIn,
      rewardAmount,
      ratioNumerator,
      ratioDenominator,
    }: {
      poolName: string;
      tokenReward: string;
      tokenIn: string;
      rewardAmount: number;
      ratioNumerator: number;
      ratioDenominator: number;
    }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = walletProvider
          ? new ethers.BrowserProvider(walletProvider as Eip1193Provider)
          : null;
        if (!provider) {
          throw new Error("Provider not found");
        }
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const contract = getContractSwapFactory(signer);
        const contractAddress = await contract.getAddress();
        const poolCreationFee: bigint = await contract.poolCreationFee();

        const rewardIsNative = isNativeToken(tokenReward);
        const depositIsNative = isNativeToken(tokenIn);

        const rewardAssetType = rewardIsNative
          ? AssetType.NATIVE
          : AssetType.ERC20;

        const depositAssetType = depositIsNative
          ? AssetType.NATIVE
          : AssetType.ERC20;

        // Determine token decimals on-chain (for ERC20)
        let rewardDecimals = DEFAULT_NATIVE_DECIMALS;
        let parsedAmount: bigint;

        if (rewardIsNative) {
          const chainId = Number((await provider.getNetwork()).chainId);
          rewardDecimals =
            getDecimalsTokenNativeByChainId(chainId)?.decimals ??
            DEFAULT_NATIVE_DECIMALS;

          parsedAmount = ethers.parseUnits(
            rewardAmount.toString(),
            rewardDecimals,
          );
        } else {
          const tokenContract = getERC20Contract(tokenReward, signer);

          const decimals = await tokenContract.decimals();
          rewardDecimals = Number(decimals);

          parsedAmount = ethers.parseUnits(
            rewardAmount.toString(),
            rewardDecimals,
          );

          const rewardTokenBalance = await tokenContract.balanceOf(userAddress);

          if (rewardTokenBalance < parsedAmount) {
            throw new Error(
              `Insufficient reward token balance. Required: ${ethers.formatUnits(parsedAmount, rewardDecimals)}`,
            );
          }

          const currentAllowance = await tokenContract.allowance(
            userAddress,
            contractAddress,
          );

          if (currentAllowance < parsedAmount) {
            const approveTx = await tokenContract.approve(
              contractAddress,
              parsedAmount,
            );

            const approveTxReceipt = await approveTx.wait();
            console.log("approveTxReceipt", approveTxReceipt);
          }
        }

        const poolNameBytes32 = ethers.encodeBytes32String(
          poolName.slice(0, 31),
        );

        const { burnUnits, rewardUnits } = normalizeRatioToIntegers(
          ratioNumerator,
          ratioDenominator,
        );

        const payload = {
          poolName: poolNameBytes32,
          projectOwner: userAddress,
          tokenReward: rewardIsNative ? ZERO_ADDRESS : tokenReward,
          assetTypeReward: rewardAssetType,
          tokenIn: depositIsNative ? ZERO_ADDRESS : tokenIn,
          assetTypeIn: depositAssetType,
          targetAddress: userAddress,
          rewardNumerator: rewardUnits, // It's reward num and dem, not ratio on onchain
          rewardDenominator: burnUnits,
          rewardAmount: parsedAmount,
        };

        const txValue = poolCreationFee + (rewardIsNative ? parsedAmount : 0n);

        await assertSufficientNativeBalanceForTransaction({
          provider,
          address: userAddress,
          txValue,
          estimateGas: () =>
            contract.createSwapPool.estimateGas(payload, {
              value: txValue,
            }),
        });

        const tx = await contract.createSwapPool(payload, {
          value: txValue,
        });

        const receipt = await tx.wait();

        toast.success("Pool created successfully!", {
          description: `Tx: ${receipt.hash}`,
        });

        const poolDeployedLog = receipt?.logs?.find((log: Log) => {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            return parsed?.name === "PoolSwapDeployed";
          } catch {
            return false;
          }
        });
        const poolAddress =
          poolDeployedLog &&
          contract.interface.parseLog({
            topics: poolDeployedLog.topics as string[],
            data: poolDeployedLog.data,
          })?.args?.pool;

        return poolAddress;
      } catch (error: unknown) {
        toast.error("Failed to create pool", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  return { createPool };
};
