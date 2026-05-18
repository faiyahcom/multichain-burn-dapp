import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { assertSufficientNativeBalanceForTransaction } from "@/utils/helpers/evm-gas";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
  getContractLaunchpadFactory,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { isNativeToken } from "@/hooks/useTokenBalance";
import { ZERO_ADDRESS } from "@/config/constant";
import type { PoolDetailResponse } from "@/types/pool";

export const useCancelPoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const cancelPoolEvm = useCallback(
    async ({
      poolAddress,
      poolDetail,
    }: {
      poolAddress: string;
      poolDetail?: PoolDetailResponse;
    }) => {
      try {
        if (!isConnected || !walletProvider)
          throw new Error("Wallet not connected");

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const contract = getContractLaunchpadFactory(signer);

        // Draft pools were created with submitPool:false (no tokens deposited).
        // The factory's cancelPool requires a submitted pool, so we must submit
        // first (depositing sale tokens) and then immediately cancel (refunding them).
        if (poolDetail?.pool?.status === "draft") {
          const contractAddress = await contract.getAddress();
          const userAddress = await signer.getAddress();

          const saleTokenAddress = poolDetail.pool.rewardToken ?? ZERO_ADDRESS;
          const saleIsNative = isNativeToken(saleTokenAddress);
          const totalSaleAmountRaw = BigInt(
            poolDetail.pool.rewardAmount ?? "0",
          );

          let nativeValue = 0n;

          if (saleIsNative) {
            nativeValue = totalSaleAmountRaw;
          } else if (totalSaleAmountRaw > 0n) {
            const saleTokenContract = getERC20Contract(
              saleTokenAddress,
              signer,
            );

            const balance: bigint =
              await saleTokenContract.balanceOf(userAddress);
            if (balance < totalSaleAmountRaw) {
              const decimals = Number(await saleTokenContract.decimals());
              throw new Error(
                `Insufficient sale token balance. Required: ${ethers.formatUnits(totalSaleAmountRaw, decimals)}`,
              );
            }

            const allowance: bigint = await saleTokenContract.allowance(
              userAddress,
              contractAddress,
            );
            if (allowance < totalSaleAmountRaw) {
              const approveTx = await saleTokenContract.approve(
                contractAddress,
                totalSaleAmountRaw,
              );
              await approveTx.wait();
            }
          }

          await assertSufficientNativeBalanceForTransaction({
            provider,
            address: userAddress,
            txValue: nativeValue,
            estimateGas: () =>
              contract.submitPool.estimateGas(poolAddress, {
                value: nativeValue,
              }),
          });

          const submitTx = await contract.submitPool(poolAddress, {
            value: nativeValue,
          });
          await submitTx.wait();
        }

        const userAddress = await signer.getAddress();
        await assertSufficientNativeBalanceForTransaction({
          provider,
          address: userAddress,
          estimateGas: () => contract.cancelPool.estimateGas(poolAddress),
        });

        const tx = await contract.cancelPool(poolAddress);
        const receipt = await tx.wait();

        toast.success("Launchpad pool cancelled!", {
          description: `Tx: ${receipt.hash}`,
        });
        return receipt.hash as string;
      } catch (error: unknown) {
        toast.error("Cancel pool failed", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  return { cancelPoolEvm };
};
