import { useCallback, useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ethers } from "ethers";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import idl from "@/web3/contracts/multichain_burn_sc_sol.json";
import {
    SOLANA_BACKEND_CHAIN_ID,
    NETWORK_CONFIGS,
    IS_MAINNET,
    getRpcUrl,
} from "@/config/networks";
import { ZERO_ADDRESS } from "@/config/constant";
import { shortenNumber } from "@/utils/helpers/numbers";


// ── Solana fallback RPC ──────────────────────────────────────────────────────
const solanaConfig = NETWORK_CONFIGS.find(
    (n) => n.backendChainId === SOLANA_BACKEND_CHAIN_ID,
);
const SOLANA_RPC_URL =
    (solanaConfig?.appKitNetwork as any)?.rpcUrls?.default?.http?.[0] ??
    (IS_MAINNET ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com");

// ── Anchor coder for PoolAccount deserialization ─────────────────────────────
const accountsCoder = new BorshAccountsCoder(idl as Idl);

// ── Helpers ──────────────────────────────────────────────────────────────────

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
 * Queries the on-chain tracked balance for both Solana and EVM pools.
 *
 * Solana: Deserializes the PoolAccount PDA and reads the program-tracked
 *         `rewardBalance` and `totalDeposited` fields directly.
 *         This is more accurate than querying raw vault balances because
 *         it avoids rent-exempt reserve subtraction issues for native SOL.
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
    /** Auto-refetch interval in ms. Omit or set 0 to disable polling. */
    refetchInterval?: number;
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
        refetchInterval,
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
                    // ── Solana: read tracked balances from PoolAccount state ──
                    const conn = appKitConnection ?? fallbackSolConnection;
                    const poolPDA = new PublicKey(poolAddress);

                    const accountInfo = await conn.getAccountInfo(poolPDA);
                    if (!accountInfo?.data) {
                        rewardRaw = "0";
                        depositRaw = "0";
                    } else {
                        // Deserialize the PoolAccount using Anchor's BorshAccountsCoder
                        const poolAccount = accountsCoder.decode(
                            "PoolAccount",
                            accountInfo.data,
                        );

                        // rewardBalance and totalDeposited are BN instances (u64)
                        // BorshAccountsCoder returns snake_case field names matching the IDL
                        rewardRaw = poolAccount.reward_balance.toString();
                        depositRaw = poolAccount.total_deposited.toString();

                        let isCollected = poolAccount.is_collected;
                        if (isCollected == true) {
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

                const fmtReward = shortenNumber({ number: Number(rewardRaw) / 10 ** (rewardTokenDecimals ?? 18) });
                const fmtDeposit = shortenNumber({ number: Number(depositRaw) / 10 ** (tokenInDecimals ?? 18) });

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

    // Auto-polling
    useEffect(() => {
        if (!refetchInterval || !poolAddress || !chainId) return;
        const id = setInterval(refetch, refetchInterval);
        return () => clearInterval(id);
    }, [refetchInterval, poolAddress, chainId, refetch]);

    return { rewardBalance, depositBalance, isSolana, refetch };
}

export type VaultBalance = ReturnType<typeof useOnChainVaultBalance>;

