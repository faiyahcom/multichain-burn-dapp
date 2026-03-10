import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
  getContractBurnFactory,
  getContractBurnFactoryInterface,
} from "@/web3/contracts/multichainBurnContractEVM";

export const useCancelRequestApproveEvmFn = () => {
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const cancelRequestApproveEvm = useCallback(
    async ({ poolAddress }: { poolAddress: string }) => {
      if (!isConnected || !walletProvider || !address) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider
      );

      const signer = await provider.getSigner();
      const contract = getContractBurnFactory(signer);
      const iface = getContractBurnFactoryInterface();

      try {
        /**
         * 1️⃣ Simulate call first (eth_call)
         * prevents wallet popup if tx would fail
         */
        const callData = iface.encodeFunctionData(
          "cancelRequestApprove",
          [poolAddress]
        );

        await provider.call({
          to: await contract.getAddress(),
          from: address,
          data: callData,
        });

        /**
         * 2️⃣ Send transaction
         */
        const tx = await contract.cancelRequestApprove(poolAddress);

        toast.loading("Cancelling approval request...", {
          id: tx.hash,
        });

        const receipt = await tx.wait();

        toast.success("Approval request cancelled successfully!", {
          id: tx.hash,
          description: `Tx: ${receipt.hash}`,
        });

        return receipt.hash;
      } catch (error: any) {
        let message = "Transaction failed";

        /**
         * 3️⃣ Try decode custom contract errors
         */
        try {
          if (error?.data) {
            const decoded = iface.parseError(error.data);
            message = decoded.name;
          }
        } catch {}

        /**
         * fallback
         */
        if (error?.shortMessage) message = error.shortMessage;
        if (error?.reason) message = error.reason;
        if (error?.message) message = error.message;

        toast.error("Failed to cancel approval request", {
          description: message,
        });

        console.error("cancelRequestApproveEvm error:", error);

        throw error;
      }
    },
    [isConnected, walletProvider, address]
  );

  return { cancelRequestApproveEvm };
};