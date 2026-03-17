import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
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
import type { PoolDetailResponse } from "@/types/pool";

export interface CancelRequestApproveSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
}

export const useCancelRequestApproveSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const cancelRequestApproveSol = useCallback(
        async ({ poolAddress, poolDetail: _poolDetail }: CancelRequestApproveSolParams) => {
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

                // ── 1. Derive PDAs ─────────────────────────────────────────
                const poolPDA = new PublicKey(poolAddress);
                const factoryPDA = getFactoryPDA(program.programId);

                // ── 2. Build TX ────────────────────────────────────────────
                const tx = await program.methods
                    .cancleRequestApprove()
                    .accounts({
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        factory: factoryPDA,
                    })
                    .transaction();

                // ── 3. Sign & send ─────────────────────────────────────────
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await connection.sendRawTransaction(
                    signedTx.serialize(),
                );

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                });

                toast.success("Approval request cancelled successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                console.log(error);

                toast.error("Failed to cancel approval request", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { cancelRequestApproveSol };
};
