import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnRouter } from "@/web3/contracts/multichainBurnContractEVM";

export interface ClaimBurnParams {
    poolAddress: string;
    merkleProof?: string[];
    /** Optional recipient override. If set, tokens are sent to this address instead of the connected wallet. */
    userAddress?: string;
}

export const useClaimBurnEvmFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const claimBurnReward = useCallback(
        async ({ poolAddress, merkleProof = [], userAddress }: ClaimBurnParams) => {
            try {
                if (!isConnected || !address || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractBurnRouter(signer);

                const tx = await contract.claim(poolAddress, userAddress ?? address, merkleProof);
                const receipt = await tx.wait();

                toast.success("Reward claimed successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to claim reward", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, walletProvider],
    );

    return { claimBurnReward };
};
