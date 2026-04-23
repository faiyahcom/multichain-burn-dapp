import type { Connection } from "@solana/web3.js";

/**
 * Wraps `connection.confirmTransaction` to handle the intermittent
 * "This transaction has already been processed" error gracefully.
 *
 * This error occurs when Solana's internal retry/broadcast delivers
 * the transaction to a validator that already processed it. The
 * transaction is actually successful, but the confirmation polling
 * surfaces a misleading error.
 *
 * When the error is detected, we verify the on-chain signature
 * status to determine if the transaction actually succeeded.
 */
export const confirmTransactionSafe = async (
    connection: Connection,
    params: {
        signature: string;
        blockhash: string;
        lastValidBlockHeight: number;
    },
): Promise<void> => {
    try {
        await connection.confirmTransaction(params);
    } catch (error: any) {
        const isAlreadyProcessed =
            typeof error?.message === "string" &&
            /already been processed/i.test(error.message);

        if (isAlreadyProcessed) {
            // Verify on-chain status — the tx may have succeeded
            const status = await connection.getSignatureStatus(params.signature);
            if (status?.value?.err) {
                // Transaction landed but the program rejected it
                throw error;
            }
            // Transaction landed and succeeded — treat as success
            return;
        }

        throw error;
    }
};
