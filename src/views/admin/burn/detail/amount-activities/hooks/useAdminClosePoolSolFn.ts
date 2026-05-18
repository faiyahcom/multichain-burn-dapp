import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
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

export interface AdminClosePoolSolParams {
    poolAddress: string;
}

export const useAdminClosePoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const adminClosePoolSol = useCallback(
        async ({ poolAddress }: AdminClosePoolSolParams) => {
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

                const factoryPDA = getFactoryPDA(program.programId);
                const poolPDA = new PublicKey(poolAddress);

                const tx = await program.methods
                    .emergencyClosePool()
                    .accounts({
                        admin: walletPublicKey,
                        factory: factoryPDA,
                        pool: poolPDA,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight },
                );

                toast.success("Pool closed successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                console.log(error);
                toast.error("Failed to close pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { adminClosePoolSol };
};
