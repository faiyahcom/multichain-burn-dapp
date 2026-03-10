import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA } from "@/web3/helpers";

export const useRequestApprovePoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const requestApproveSol = useCallback(
        async ({ poolAddress }: { poolAddress: string }) => {
            try {
                if (!isConnected || !address) {
                    throw new Error("Wallet not connected");
                }
                if (!connection || !provider) {
                    throw new Error("Solana connection or provider is not available");
                }

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);

                const poolPDA = new PublicKey(poolAddress);
                const factoryPDA = getFactoryPDA(program.programId);

                const tx = await program.methods
                    .requestOpenPool()
                    .accounts({
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        factory: factoryPDA,
                    })
                    .rpc();

                toast.success("Pool approval requested successfully!", {
                    description: `Tx: ${tx}`,
                });

                return tx;
            } catch (error: any) {
                toast.error("Failed to request pool approval", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { requestApproveSol };
};
