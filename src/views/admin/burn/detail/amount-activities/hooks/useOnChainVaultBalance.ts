import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import {
    getRewardVaultPDA,
    getDepositVaultPDA,
    AssetTypeEnum,
} from "@/web3/helpers";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import { SOLANA_BACKEND_CHAIN_ID, NETWORK_CONFIGS } from "@/config/networks";

// Get Solana RPC URL from the network config
const solanaConfig = NETWORK_CONFIGS.find((n) => n.backendChainId === SOLANA_BACKEND_CHAIN_ID);
const SOLANA_RPC_URL =
    (solanaConfig?.appKitNetwork as any)?.rpcUrls?.default?.http?.[0]
    ?? "https://api.devnet.solana.com";

/**
 * Queries the real on-chain vault balance for a Solana pool.
 * For SPL tokens → uses getTokenAccountBalance on the vault PDA.
 * For native SOL (So111…) → uses getBalance (lamports) on the vault PDA.
 *
 * Returns human-readable formatted strings (e.g. "1,800") or undefined while loading.
 */
export function useOnChainVaultBalance(params: {
    poolAddress?: string;
    chainId?: string;
    rewardTokenDecimals?: number;
    tokenInDecimals?: number;
    assetTypeReward?: number;
    assetTypeIn?: number;
}) {
    const {
        poolAddress,
        chainId,
        rewardTokenDecimals,
        tokenInDecimals,
        assetTypeReward,
        assetTypeIn,
    } = params;

    // Try AppKit connection first; fall back to a direct one
    const { connection: appKitConnection } = useAppKitConnection();
    const fallbackConnection = useMemo(
        () => new Connection(SOLANA_RPC_URL, "confirmed"),
        [],
    );
    const isSolana = chainId === SOLANA_BACKEND_CHAIN_ID;

    const [rewardBalance, setRewardBalance] = useState<string | undefined>();
    const [depositBalance, setDepositBalance] = useState<string | undefined>();

    useEffect(() => {
        if (!isSolana || !poolAddress) return;

        // Prefer the AppKit connection (uses wallet's RPC), else use direct devnet connection
        const conn = appKitConnection ?? fallbackConnection;

        let cancelled = false;

        const fetchBalances = async () => {
            try {
                const poolPDA = new PublicKey(poolAddress);
                const rewardVault = getRewardVaultPDA(poolPDA, MULTICHAIN_BURN_PROGRAM_ID);
                const depositVault = getDepositVaultPDA(poolPDA, MULTICHAIN_BURN_PROGRAM_ID);

                // ── Reward vault ──
                const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;
                let rewardRaw: string;
                if (isNativeReward) {
                    const lamports = await conn.getBalance(rewardVault);
                    rewardRaw = lamports.toString();
                } else {
                    try {
                        const resp = await conn.getTokenAccountBalance(rewardVault);
                        rewardRaw = resp.value.amount;
                    } catch {
                        rewardRaw = "0";
                    }
                }

                // ── Deposit vault ──
                const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;
                let depositRaw: string;
                if (isNativeDeposit) {
                    const lamports = await conn.getBalance(depositVault);
                    depositRaw = lamports.toString();
                } else {
                    try {
                        const resp = await conn.getTokenAccountBalance(depositVault);
                        depositRaw = resp.value.amount;
                    } catch {
                        depositRaw = "0";
                    }
                }

                if (cancelled) return;

                // Format as human-readable
                const fmtReward = formatBalance(rewardRaw, rewardTokenDecimals ?? 9);
                const fmtDeposit = formatBalance(depositRaw, tokenInDecimals ?? 9);

                console.log("[useOnChainVaultBalance] Results:", {
                    rewardRaw,
                    depositRaw,
                    fmtReward,
                    fmtDeposit,
                });

                setRewardBalance(fmtReward);
                setDepositBalance(fmtDeposit);
            } catch (err) {
                console.error("[useOnChainVaultBalance] Failed to query vault:", err);
            }
        };

        fetchBalances();

        return () => {
            cancelled = true;
        };
    }, [isSolana, poolAddress, appKitConnection, fallbackConnection, rewardTokenDecimals, tokenInDecimals, assetTypeReward, assetTypeIn]);

    return { rewardBalance, depositBalance, isSolana };
}

function formatBalance(rawAmount: string, decimals: number): string {
    const num = Number(rawAmount) / 10 ** decimals;
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.min(decimals, 4),
    });
}
