import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractStakeFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";

// Note: the staking contract only exposes claimReward(pool, stakeId) individually.
// This hook iterates over all provided stakeIds and claims each in sequence.
export const useClaimAllEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const claimAllEvm = useCallback(
        async ({
            poolAddress,
            stakeIds,
        }: {
            poolAddress: string;
            stakeIds: number[];
        }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }
                if (!stakeIds.length) return;

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractStakeFactory(signer);

                let lastHash: string | undefined;
                for (const stakeId of stakeIds) {
                    const tx = await contract.claimReward(poolAddress, stakeId);
                    const receipt = await tx.wait();
                    lastHash = receipt.hash;
                }

                toast.success("All rewards claimed!", {
                    description: lastHash ? `Tx: ${lastHash}` : undefined,
                });

                return lastHash;
            } catch (error: any) {
                toast.error("Failed to claim rewards", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { claimAllEvm };
};
