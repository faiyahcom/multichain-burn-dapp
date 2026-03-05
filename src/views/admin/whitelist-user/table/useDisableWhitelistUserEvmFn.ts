import { getMultichainBurnContract } from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "sonner";

export const useDisableWhitelistUserEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const disableWhitelistUser = useCallback(
        async ({ userAddress, whitelist }: { userAddress: string; whitelist: boolean }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("EVM wallet not connected");
                }

                // Guard: ensure address is a valid EVM hex address
                if (!/^0x[0-9a-fA-F]{40}$/.test(userAddress)) {
                    throw new Error(`"${userAddress}" is not a valid EVM address — are you on the right network?`);
                }

                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();
                const contract = getMultichainBurnContract(signer);

                const tx = whitelist
                    ? await contract.whitelistAddress(userAddress)
                    : await contract.removeWhitelistAddress(userAddress);
                const receipt = await tx.wait();

                toast.success(whitelist ? "User added to whitelist!" : "User removed from whitelist!", {
                    description: `Tx: ${receipt.hash}`,
                });
                return true;
            } catch (error: any) {
                console.error("[toggleWhitelistUserEvm] error:", error);
                toast.error(whitelist ? "Failed to enable user" : "Failed to remove user from whitelist", {
                    description: error?.reason ?? error?.message ?? String(error),
                });
                return false;
            }
        },
        [isConnected, walletProvider],
    );

    return { disableWhitelistUser };
};
