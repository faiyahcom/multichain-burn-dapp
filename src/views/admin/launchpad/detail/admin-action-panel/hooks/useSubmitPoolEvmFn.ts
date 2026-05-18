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

export const useSubmitPoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const submitPoolEvm = useCallback(
    async ({
      poolAddress,
      poolDetail,
    }: {
      poolAddress: string;
      poolDetail: PoolDetailResponse;
    }) => {
      try {
        if (!isConnected || !walletProvider)
          throw new Error("Wallet not connected");

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const contract = getContractLaunchpadFactory(signer);
        const contractAddress = await contract.getAddress();

        // Sale token is stored as rewardToken in pool detail (what buyers receive)
        const saleTokenAddress = poolDetail.pool.rewardToken ?? ZERO_ADDRESS;
        const saleIsNative = isNativeToken(saleTokenAddress);

        // totalSaleAmount from backend (raw units)
        const totalSaleAmountRaw = BigInt(poolDetail.pool.rewardAmount ?? "0");

        let nativeValue = 0n;

        if (saleIsNative) {
          // Native token: send as msg.value
          nativeValue = totalSaleAmountRaw;
        } else if (totalSaleAmountRaw > 0n) {
          // ERC20: approve the contract to spend the sale tokens
          const saleTokenContract = getERC20Contract(saleTokenAddress, signer);

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

        const tx = await contract.submitPool(poolAddress, {
          value: nativeValue,
        });
        const receipt = await tx.wait();

        toast.success("Launchpad pool submitted!", {
          description: `Tx: ${receipt.hash}`,
        });
        return receipt.hash as string;
      } catch (error: unknown) {
        toast.error("Submit pool failed", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  return { submitPoolEvm };
};
