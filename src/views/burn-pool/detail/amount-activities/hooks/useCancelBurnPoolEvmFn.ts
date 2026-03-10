import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useCancelBurnPoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const cancelBurnPool = useCallback(
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

                const tx = await contract.cancelPool(poolAddress);
                const receipt = await tx.wait();

                toast.success("Pool cancelled successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to cancel pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { cancelBurnPool };
};
