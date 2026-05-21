import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { assertSufficientNativeBalanceForTransaction } from "@/utils/helpers/evm-gas";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractLaunchpadFactory } from "@/web3/contracts/multichainBurnContractEVM";
import type { PoolDetailResponse } from "@/types/pool";

export const useCancelPoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const cancelPoolEvm = useCallback(
    async ({
      poolAddress,
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
