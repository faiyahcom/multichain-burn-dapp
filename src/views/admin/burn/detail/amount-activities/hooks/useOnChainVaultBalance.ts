import { useCallback, useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import {
    getRewardVaultPDA,
    getDepositVaultPDA,
    AssetTypeEnum,
} from "@/web3/helpers";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    SOLANA_BACKEND_CHAIN_ID,
    NETWORK_CONFIGS,
    getRpcUrl,
} from "@/config/networks";
import { ZERO_ADDRESS } from "@/config/constant";


// ── Solana fallback RPC ──────────────────────────────────────────────────────
const solanaConfig = NETWORK_CONFIGS.find(
    (n) => n.backendChainId === SOLANA_BACKEND_CHAIN_ID,
);
const SOLANA_RPC_URL =
    (solanaConfig?.appKitNetwork as any)?.rpcUrls?.default?.http?.[0] ??
    "https://api.devnet.solana.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBalance(rawAmount: string, decimals: number): string {
    const num = Number(rawAmount) / 10 ** decimals;
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: Math.min(decimals, 4),
    });
}

function isNativeEvm(tokenAddress: string): boolean {
    return (
        !tokenAddress ||
        tokenAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase() ||
        tokenAddress.toLowerCase() === "native"
    );
}

// ── EVM balance fetcher ──────────────────────────────────────────────────────

async function fetchEvmBalance(
    rpcUrl: string,
    poolAddress: string,
    tokenAddress: string,
): Promise<string> {
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    if (isNativeEvm(tokenAddress)) {
        // Pool holds native ETH/BNB → query contract balance
        const bal = await provider.getBalance(poolAddress);
        return bal.toString();
    }

    // Pool holds ERC20 → balanceOf(poolAddress)
    const erc20 = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        provider,
    );
    const bal: bigint = await erc20.balanceOf(poolAddress);
    return bal.toString();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Queries the real on-chain vault balance for both Solana and EVM pools.
 *
 * Solana: SPL token → getTokenAccountBalance on vault PDA.
 *         Native SOL → getAccountInfo on vault PDA, then subtract the exact
 *                      rent-exempt reserve (based on the account's data length)
 *                      so the result matches the program's tracked balance.
 *
 * EVM:    ERC20 → balanceOf(poolAddress) on the token contract.
 *         Native ETH/BNB → provider.getBalance(poolAddress).
 *
 * Returns human-readable formatted strings or undefined while loading.
 */
export function useOnChainVaultBalance(params: {
    poolAddress?: string;
    chainId?: string;
    rewardToken?: string;
    tokenIn?: string;
    rewardTokenDecimals?: number;
    tokenInDecimals?: number;
    assetTypeReward?: number;
    assetTypeIn?: number;
}) {
    const {
        poolAddress,
        chainId,
        rewardToken,
        tokenIn,
        rewardTokenDecimals,
        tokenInDecimals,
        assetTypeReward,
        assetTypeIn,
    } = params;

    // Solana connection (AppKit or fallback)
    const { connection: appKitConnection } = useAppKitConnection();
    const fallbackSolConnection = useMemo(
        () => new Connection(SOLANA_RPC_URL, "confirmed"),
        [],
    );
    const isSolana = chainId === SOLANA_BACKEND_CHAIN_ID;

    const [rewardBalance, setRewardBalance] = useState<string | undefined>();
    const [depositBalance, setDepositBalance] = useState<string | undefined>();
    const [refetchKey, setRefetchKey] = useState(0);
    const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

    useEffect(() => {
        if (!poolAddress || !chainId) return;

        let cancelled = false;

        const fetchBalances = async () => {
            try {
                let rewardRaw: string;
                let depositRaw: string;

                if (isSolana) {
                    // ── Solana ────────────────────────────────────────────────
                    const conn = appKitConnection ?? fallbackSolConnection;
                    const poolPDA = new PublicKey(poolAddress);
                    const rewardVault = getRewardVaultPDA(poolPDA, MULTICHAIN_BURN_PROGRAM_ID);
                    const depositVault = getDepositVaultPDA(poolPDA, MULTICHAIN_BURN_PROGRAM_ID);

                    const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;
                    const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;

                    // Fetch pool account info once — used for rent-exempt calculation
                    // when either token is native SOL.
                    let poolAccountInfo: Awaited<ReturnType<typeof conn.getAccountInfo>> = null;
                    if (isNativeReward || isNativeDeposit) {
                        poolAccountInfo = await conn.getAccountInfo(poolPDA);
                    }
                    const poolRentExempt = poolAccountInfo
                        ? await conn.getMinimumBalanceForRentExemption(poolAccountInfo.data.length)
                        : 0;

                    if (isNativeReward) {
                        const rewardTotal = poolAccountInfo?.lamports ?? 0;
                        rewardRaw = Math.max(0, rewardTotal - poolRentExempt).toString();
                    } else {
                        try {
                            rewardRaw = (await conn.getTokenAccountBalance(rewardVault)).value.amount;
                        } catch {
                            rewardRaw = "0";
                        }
                    }

                    if (isNativeDeposit) {
                        const depositTotal = poolAccountInfo?.lamports ?? 0;
                        depositRaw = Math.max(0, depositTotal - poolRentExempt).toString();
                    } else {
                        try {
                            depositRaw = (await conn.getTokenAccountBalance(depositVault)).value.amount;
                        } catch {
                            depositRaw = "0";
                        }
                    }
                } else {
                    // ── EVM ───────────────────────────────────────────────────
                    const rpcUrl = getRpcUrl(chainId);

                    if (!rpcUrl) {
                        console.warn("[useOnChainVaultBalance] No RPC URL for chainId:", chainId);
                        return;
                    }

                    // On EVM the pool IS the contract — tokens are held directly
                    rewardRaw = rewardToken
                        ? await fetchEvmBalance(rpcUrl, poolAddress, rewardToken)
                        : "0";

                    depositRaw = tokenIn
                        ? await fetchEvmBalance(rpcUrl, poolAddress, tokenIn)
                        : "0";
                }

                if (cancelled) return;

                const fmtReward = formatBalance(rewardRaw, rewardTokenDecimals ?? 18);
                const fmtDeposit = formatBalance(depositRaw, tokenInDecimals ?? 18);

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
    }, [
        isSolana,
        poolAddress,
        chainId,
        rewardToken,
        tokenIn,
        appKitConnection,
        fallbackSolConnection,
        rewardTokenDecimals,
        tokenInDecimals,
        assetTypeReward,
        assetTypeIn,
        refetchKey,
    ]);

    return { rewardBalance, depositBalance, isSolana, refetch };
}

export type VaultBalance = ReturnType<typeof useOnChainVaultBalance>;
