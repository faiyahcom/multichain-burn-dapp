import bs58 from "bs58";
import type { Connection, SendOptions } from "@solana/web3.js";

/**
 * Extracts the first transaction signature from serialized Solana transaction bytes.
 * Wire format: compact-u16 sig count, then N × 64-byte signatures.
 * For a single-signer tx the first byte is 0x01.
 */
const extractSignatureFromSerialized = (serialized: Buffer | Uint8Array): string | null => {
    try {
        const sigCount = serialized[0];
        if (!sigCount) return null;
        const sigBytes = serialized.slice(1, 65);
        return bs58.encode(sigBytes);
    } catch {
        return null;
    }
};

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

    // Extract signature before sending so we can verify it if the RPC
    // rejects with "already processed" (wallet may have auto-submitted).
    const preExtractedSig = extractSignatureFromSerialized(signedTxSerialized);

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
        if (isAlreadyProcessedError(error) && preExtractedSig) {
            // Wallet auto-broadcast the tx — confirm it normally.
            // confirmTransactionSafe handles the "already processed" case
            // during polling, so this is safe even if the tx lands before
            // confirmTransaction starts tracking it.
            await confirmTransactionSafe(connection, {
                signature: preExtractedSig,
                ...blockhashInfo,
            });
            return preExtractedSig;
        }
        throw error;
    }

    await confirmTransactionSafe(connection, {
        signature,
        ...blockhashInfo,
    });

    return signature;
};
