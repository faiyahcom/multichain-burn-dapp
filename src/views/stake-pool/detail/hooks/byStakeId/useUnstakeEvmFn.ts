import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractStakeFactory } from "@/web3/contracts/multichainBurnContractEVM";

const UNSTAKE_ERROR_MESSAGE =
  "Failed to unstake your token. Please try again.";

export const useUnstakeEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const unstakeEvm = useCallback(
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

                const tx = await contract.unstake(poolAddress, stakeId);
                const receipt = await tx.wait();

                toast.success("Unstaked successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: unknown) {
                toast.error(UNSTAKE_ERROR_MESSAGE);
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { unstakeEvm };
};
