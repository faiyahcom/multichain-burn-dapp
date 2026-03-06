import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnFactory } from "@/web3/contracts/multichainBurnContractEVM";

export const useAdminClosePoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const adminClosePoolEvm = useCallback(
        async ({ poolAddress }: { poolAddress: string }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractBurnFactory(signer);

                const tx = await contract.emergencyClose(poolAddress);
                const receipt = await tx.wait();

                toast.success("Pool closed successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to close pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { adminClosePoolEvm };
};
