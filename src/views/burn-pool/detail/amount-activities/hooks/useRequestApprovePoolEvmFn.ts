import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnFactory } from "@/web3/contracts/multichainBurnContractEVM";

export const useRequestApprovePoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const requestApprovePool = useCallback(
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

                const tx = await contract.requestApprove(poolAddress);
                const receipt = await tx.wait();

                toast.success("Pool approval requested successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to request pool approval", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { requestApprovePool };
};
