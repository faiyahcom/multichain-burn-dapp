import { useEffect, useMemo, useState } from "react";
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
    chainIdToNetworkConfig,
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
 *         Native SOL → getBalance on vault PDA.
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
                    if (isNativeReward) {
                        rewardRaw = (await conn.getBalance(rewardVault)).toString();
                    } else {
                        try {
                            rewardRaw = (await conn.getTokenAccountBalance(rewardVault)).value.amount;
                        } catch {
                            rewardRaw = "0";
                        }
                    }

                    const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;
                    if (isNativeDeposit) {
                        depositRaw = (await conn.getBalance(depositVault)).toString();
                    } else {
                        try {
                            depositRaw = (await conn.getTokenAccountBalance(depositVault)).value.amount;
                        } catch {
                            depositRaw = "0";
                        }
                    }
                } else {
                    // ── EVM ───────────────────────────────────────────────────
                    const networkConfig = chainIdToNetworkConfig(chainId);
                    const rpcUrl =
                        (networkConfig?.appKitNetwork as any)?.rpcUrls?.default?.http?.[0];

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
    ]);

    return { rewardBalance, depositBalance, isSolana };
}
