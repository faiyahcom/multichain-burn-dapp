import type { Connection, SendOptions } from "@solana/web3.js";

/**
 * Checks whether an error is the intermittent
 * "This transaction has already been processed" error.
 */
const isAlreadyProcessedError = (error: any): boolean =>
    typeof error?.message === "string" &&
    /already been processed/i.test(error.message);

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
        if (isAlreadyProcessedError(error)) {
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

/**
 * Sends a signed transaction and confirms it, handling
 * "This transaction has already been processed" at BOTH stages:
 *
 * 1. `sendRawTransaction` — can throw this during preflight or
 *    when the RPC node's internal retry detects a duplicate.
 * 2. `confirmTransaction` — can throw this during polling.
 *
 * Returns the transaction signature on success.
 */
export const sendAndConfirmTransactionSafe = async (
    connection: Connection,
    signedTxSerialized: Buffer | Uint8Array,
    blockhashInfo: {
        blockhash: string;
        lastValidBlockHeight: number;
    },
    sendOptions?: SendOptions,
): Promise<string> => {
    let signature: string;

    try {
        signature = await connection.sendRawTransaction(
            signedTxSerialized,
            {
                skipPreflight: false,
                maxRetries: 0,
                ...sendOptions,
            },
        );
    } catch (error: any) {
        if (isAlreadyProcessedError(error)) {
            // Extract signature from the error logs if available,
            // otherwise fall back to computing it from the transaction.
            const sigMatch = error?.message?.match(/signature[:\s]+([A-Za-z0-9]{87,88})/);
            if (sigMatch?.[1]) {
                const extractedSig = sigMatch[1];
                const status = await connection.getSignatureStatus(extractedSig);
                if (status?.value && !status.value.err) {
                    return extractedSig;
                }
            }
            // If we can't extract/verify, the tx likely succeeded but we
            // can't confirm — re-throw so the caller can handle it
            throw error;
        }
        throw error;
    }

    await confirmTransactionSafe(connection, {
        signature,
        ...blockhashInfo,
    });

    return signature;
};
