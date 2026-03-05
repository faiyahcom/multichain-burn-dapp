import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA } from "@/web3/helpers";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "sonner";

export const useCreateWhitelistUserSolanaFn = () => {
    const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createWhitelistUser = useCallback(
        async ({ userAddress }: { userAddress: string }) => {
            try {
                if (!isConnected || !address) {
                    throw new Error("Wallet is not connected");
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

                const userPubkey = new PublicKey(userAddress);

                const tx = await program.methods
                    .updateWhitelistUser(userPubkey, true) // false to remove
                    .accounts({
                        admin: walletPublicKey,
                        factory: factoryPDA,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                // Sign
                const signedTx = await provider.signTransaction(tx);

                // Send
                const signature = await connection.sendRawTransaction(
                    signedTx.serialize(),
                );

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                });

                toast.success("User whitelisted on-chain successfully!", {
                    description: `Tx: ${signature}`,
                });

                return true;
            } catch (error: any) {
                toast.error("Failed to whitelist user on Solana", {
                    description: error?.message || String(error),
                });
                return false;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createWhitelistUser };
};
