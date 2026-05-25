import type { Connection } from "@solana/web3.js";
import type { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { formatAmount } from "@/utils/helpers/numbers";

/**
 * Throws if the wallet's native SOL lamport balance is below `requiredLamports`.
 */
export async function assertSufficientNativeSolBalance({
    connection,
    walletPublicKey,
    requiredLamports,
    symbol = "SOL",
    decimals = 9,
}: {
    connection: Connection;
    walletPublicKey: PublicKey;
    requiredLamports: BN;
    symbol?: string;
    decimals?: number;
}): Promise<void> {
    const balance = await connection.getBalance(walletPublicKey);
    const balanceBN = new BN(balance.toString());
    if (balanceBN.lt(requiredLamports)) {
        throw new Error(
            `Insufficient ${symbol} balance. Required: ${formatAmount(requiredLamports.toString(), decimals)} ${symbol}, available: ${formatAmount(balanceBN.toString(), decimals)} ${symbol}.`,
        );
    }
}

/**
 * Throws if the SPL / Token-2022 ATA balance is below `requiredAmount`.
 * If the ATA does not exist the effective balance is treated as 0.
 */
export async function assertSufficientSplTokenBalance({
    connection,
    tokenAta,
    requiredAmount,
    symbol,
    decimals,
}: {
    connection: Connection;
    tokenAta: PublicKey;
    requiredAmount: BN;
    symbol: string;
    decimals: number;
}): Promise<void> {
    let balanceBN = new BN(0);
    try {
        const resp = await connection.getTokenAccountBalance(tokenAta);
        balanceBN = new BN(resp.value.amount);
    } catch {
        // ATA does not exist → balance is 0
    }
    if (balanceBN.lt(requiredAmount)) {
        throw new Error(
            `Insufficient ${symbol} balance. Required: ${formatAmount(requiredAmount.toString(), decimals)} ${symbol}, available: ${formatAmount(balanceBN.toString(), decimals)} ${symbol}.`,
        );
    }
}
