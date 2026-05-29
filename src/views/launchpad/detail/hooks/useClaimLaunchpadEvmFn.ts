import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractLaunchpadFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface ClaimLaunchpadParams {
    poolAddress: string;
}

export const useClaimLaunchpadEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const claimLaunchpadEvm = useCallback(
        async ({ poolAddress }: ClaimLaunchpadParams) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractLaunchpadFactory(signer);

                const tx = await contract.claim(poolAddress);
                const receipt = await tx.wait();

                toast.success("Claimed successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash as string;
            } catch (error: unknown) {
                const message = getErrorMessage({ error });
                toast.error("Failed to claim", {
                    description: message,
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { claimLaunchpadEvm };
};
