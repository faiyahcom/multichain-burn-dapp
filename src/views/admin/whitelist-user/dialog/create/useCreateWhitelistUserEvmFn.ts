import { getMultichainBurnContract } from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "sonner";

export const useCreateWhitelistUserEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const createWhitelistUser = useCallback(
        async ({ userAddress }: { userAddress: string }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("EVM wallet not connected");
                }
                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();
                const contract = getMultichainBurnContract(signer);
                const tx = await contract.whitelistAddress(userAddress);
                const receipt = await tx.wait();
                toast.success("User whitelisted on EVM!", {
                    description: `Tx: ${receipt.hash}`,
                });
                return true;
            } catch (error: any) {
                toast.error("Failed to whitelist user on EVM", {
                    description: error?.message || String(error),
                });
                return false;
            }
        },
        [isConnected, walletProvider],
    );

    return { createWhitelistUser };
};
