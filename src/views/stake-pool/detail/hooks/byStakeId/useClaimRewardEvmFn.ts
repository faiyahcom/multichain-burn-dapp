import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractStakeFactory } from "@/web3/contracts/multichainBurnContractEVM";

const CLAIM_REWARD_ERROR_MESSAGE =
  "Failed to claim your reward. Please try again.";

export const useClaimRewardEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const claimRewardEvm = useCallback(
        async ({ poolAddress, stakeId }: { poolAddress: string; stakeId: number }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractStakeFactory(signer);

                const tx = await contract.claimReward(poolAddress, stakeId);
                const receipt = await tx.wait();

                toast.success("Reward claimed successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: unknown) {
                toast.error(CLAIM_REWARD_ERROR_MESSAGE);
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { claimRewardEvm };
};
