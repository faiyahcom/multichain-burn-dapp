import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import BN from "bn.js";
import { NETWORK_CONFIGS, getRpcUrl, SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import { PublicKey } from "@solana/web3.js";
import { getFactoryPDA } from "@/web3/helpers";
import { getContractSwapFactory } from "@/web3/contracts/multichainBurnContractEVM";
import {
    useAppKitConnection,
} from "@reown/appkit-adapter-solana/react";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";

// Read-only dummy wallet — sign methods are never invoked for .fetch() calls
const DUMMY_PUBKEY = new PublicKey("11111111111111111111111111111111");
const readOnlyWallet: BrowserWallet = {
    publicKey: DUMMY_PUBKEY,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
};

export type FeeSettingsData = {
    creationFee: BN | null;
    settlementFee: BN | null;
    treasury: string | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    updateValues: (cf: BN, sf: BN, tr: string) => void;
};

export const DECIMAL_FEE_PERCENT = 10000;

/**
 * Reads the current creation fee, settlement fee, and treasury address
 * from the burn factory contract for the given EVM network on mount
 * (and whenever networkId or fetchKey changes).
 */
export function useFeeSettings(networkId: string | undefined): FeeSettingsData {
    const [creationFee, setCreationFee] = useState<BN | null>(null);
    const [settlementFee, setSettlementFee] = useState<BN | null>(null);
    const [treasury, setTreasury] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchKey, setFetchKey] = useState(0);
    const { connection } = useAppKitConnection();

    const refetch = useCallback(() => setFetchKey((k) => k + 1), []);
    const updateValues = useCallback((cf: BN, sf: BN, tr: string) => {
        setCreationFee(cf);
        setSettlementFee(sf);
        setTreasury(tr);
    }, []);

    useEffect(() => {
        if (!networkId) return;

        const networkConfig = NETWORK_CONFIGS.find((n) => n.id === networkId);
        if (!networkConfig) return;

        let cancelled = false;

        setIsLoading(true);
        setError(null);
        // Reset stale values so UI doesn't show data from the previous network
        setCreationFee(null);
        setSettlementFee(null);
        setTreasury(null);

        const fetchData = async () => {
            try {
                if (networkConfig.backendChainId === SOLANA_BACKEND_CHAIN_ID) {
                    if (!connection) {
                        throw new Error("Solana connection is not available");
                    }
                    // ── Solana path ───────────────────────────────────────────────
                    const program = getMultichainBurnProgram(connection, readOnlyWallet);
                    const factoryPDA = getFactoryPDA(program.programId);

                    const factory =
                        // @ts-ignore — IDL type is inferred at runtime
                        await program.account.factoryAccount.fetch(factoryPDA);

                    if (cancelled) return;

                    setCreationFee(new BN(factory.poolCreationFee.toString()));
                    setSettlementFee(new BN(factory.settlementFeeBps.toString()));
                    setTreasury((factory.treasury as PublicKey).toString());
                } else {
                    // ── EVM path (read-only, no wallet needed) ───────────────────
                    const rpcUrl = getRpcUrl(networkConfig.backendChainId);
                    if (!rpcUrl) throw new Error("No RPC URL for network");

                    const jsonProvider = new ethers.JsonRpcProvider(rpcUrl);
                    const factoryContract = getContractSwapFactory(
                        jsonProvider as unknown as ethers.Signer,
                    );

                    const [cf, sf, tr] = await Promise.all([
                        factoryContract.poolCreationFee() as Promise<bigint>,
                        factoryContract.settlementFee() as Promise<bigint>,
                        factoryContract.treasury() as Promise<string>,
                    ]);

                    if (cancelled) return;
                    setCreationFee(new BN(cf.toString()));
                    setSettlementFee(new BN(sf.toString()));
                    setTreasury(tr);
                }
            } catch (err: unknown) {
                if (cancelled) return;
                setError(
                    err instanceof Error ? err.message : "Failed to fetch fee settings",
                );
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [networkId, fetchKey]);

    return { creationFee, settlementFee, treasury, isLoading, error, refetch, updateValues };
}
