import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnFactory } from "@/web3/contracts/multichainBurnContractEVM";

export const useAdminApprovePoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const adminApprovePoolEvm = useCallback(
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

                const tx = await contract.approvePool(poolAddress, true);
                const receipt = await tx.wait();

                toast.success("Pool approved successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to approve pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { adminApprovePoolEvm };
};
