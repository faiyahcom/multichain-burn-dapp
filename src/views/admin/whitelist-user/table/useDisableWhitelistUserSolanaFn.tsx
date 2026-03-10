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
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useDisableWhitelistUserSolanaFn = () => {
    const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const disableWhitelistUser = useCallback(
        async ({ userAddress, whitelist }: { userAddress: string; whitelist: boolean }) => {
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
                    .updateWhitelistUser(userPubkey, whitelist)
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

                const signedTx = await provider.signTransaction(tx);
                const signature = await connection.sendRawTransaction(signedTx.serialize());

                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                toast.success(whitelist ? "User added to whitelist!" : "User removed from whitelist!", {
                    description: `Tx: ${signature}`,
                });
                return true;
            } catch (error: any) {
                toast.error(whitelist ? "Failed to enable user" : "Failed to remove user from whitelist", {
                    description: getErrorMessage({ error }),
                });
                return false;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { disableWhitelistUser };
};
