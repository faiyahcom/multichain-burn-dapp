import { useState, useEffect } from "react";
import { APPKIT_PROJECT_ID } from "@/config/constant";

// ─── Dev toggle ──────────────────────────────────────────────────────────────
/**
 * Set to `true` to include Solana wallet options in the in-app browser prompt.
 * Phantom, Solflare, and Backpack will appear in a dedicated "Solana" section
 * below the EVM wallet grid.
 */
export const SHOW_SOL_WALLETS = true;
// ─────────────────────────────────────────────────────────────────────────────

const EXPLORER_BASE = "https://explorer-api.walletconnect.com";

const logoUrl = (imageId: string) =>
    `${EXPLORER_BASE}/v3/logo/md/${imageId}?projectId=${APPKIT_PROJECT_ID}`;

export interface WalletDeepLinkEntry {
    id: string;
    name: string;
    /** Explorer API logo URL, empty string when falling back to offline data. */
    imageUrl: string;
    buildLink: (url: string) => string;
    /** True for the curated "top" wallets shown on the first screen without expanding. */
    featured: boolean;
    /** True for Solana-specific wallets — shown in a separate section. */
    isSolana: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVM — known wallets with wallet-specific dApp browser URL formats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * EVM wallets that need a non-generic dApp-browser URL format.
 * Key = WalletConnect Explorer listing ID.
 */
const EVM_KNOWN_BUILDERS: Record<string, (url: string) => string> = {
    // MetaMask
    c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96: (url) => {
        const { hostname, pathname, search } = new URL(url);
        return `https://metamask.app.link/dapp/${hostname}${pathname}${search}`;
    },
    // Trust Wallet
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0": (url) =>
        `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
    // Coinbase Wallet
    fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa: (url) =>
        `https://go.cb-wallet.com/dapp?url=${encodeURIComponent(url)}`,
    // Rainbow
    "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369": (url) =>
        `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
    // OKX Wallet
    "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709": (url) =>
        `https://www.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`)}`,
};

/** Stable display order for EVM known wallets. */
const EVM_KNOWN_ORDER = Object.keys(EVM_KNOWN_BUILDERS);

const EVM_FALLBACK_NAMES: Record<string, string> = {
    c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96: "MetaMask",
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0":
        "Trust Wallet",
    fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa:
        "Coinbase Wallet",
    "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369": "Rainbow",
    "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709":
        "OKX Wallet",
};

// ─────────────────────────────────────────────────────────────────────────────
// Solana — known wallets + Solana Mobile Stack deep-link scheme
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Solana wallets with a specific dApp-browser URL builder.
 *
 * These follow the Solana Mobile Stack Universal Links spec:
 *   `{appUrl}/ul/{version}/browse/{encodedDappUrl}?ref={encodedHost}`
 *
 * Key = WalletConnect Explorer listing ID.
 */
const SOL_KNOWN_BUILDERS: Record<string, (url: string) => string> = {
    // Phantom — a797aa...
    a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393: (url) => {
        const ref = encodeURIComponent(new URL(url).hostname);
        return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${ref}`;
    },
    // Solflare — df43f3...
    df43f30e3e1a453b0d4c5b62b1bc3c71bbedf7b3e23b5ad9cf9d6de3bdd5cd74: (url) => {
        const ref = encodeURIComponent(new URL(url).hostname);
        return `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${ref}`;
    },
    // Backpack — dd43a6...
    dd43a63bf1e7e97b66bd3a9e58ff14d4977e21afbde6e1f1dee82f57a68b51f5: (url) => {
        const ref = encodeURIComponent(new URL(url).hostname);
        return `https://backpack.app/ul/v1/browse/${encodeURIComponent(url)}?ref=${ref}`;
    },
};

/** Curated display order for Solana wallets (most popular first). */
const SOL_KNOWN_ORDER = Object.keys(SOL_KNOWN_BUILDERS);

/**
 * Offline fallback for Solana wallets (shown while API is loading or on error).
 * Images are intentionally empty — the API provides them when reachable.
 */
const SOL_FALLBACK_ENTRIES: WalletDeepLinkEntry[] = [
    {
        id: "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
        name: "Phantom",
        imageUrl: "",
        buildLink:
            SOL_KNOWN_BUILDERS[
            "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393"
            ]!,
        featured: true,
        isSolana: true,
    },
    {
        id: "df43f30e3e1a453b0d4c5b62b1bc3c71bbedf7b3e23b5ad9cf9d6de3bdd5cd74",
        name: "Solflare",
        imageUrl: "",
        buildLink:
            SOL_KNOWN_BUILDERS[
            "df43f30e3e1a453b0d4c5b62b1bc3c71bbedf7b3e23b5ad9cf9d6de3bdd5cd74"
            ]!,
        featured: true,
        isSolana: true,
    },
    {
        id: "dd43a63bf1e7e97b66bd3a9e58ff14d4977e21afbde6e1f1dee82f57a68b51f5",
        name: "Backpack",
        imageUrl: "",
        buildLink:
            SOL_KNOWN_BUILDERS[
            "dd43a63bf1e7e97b66bd3a9e58ff14d4977e21afbde6e1f1dee82f57a68b51f5"
            ]!,
        featured: true,
        isSolana: true,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Explorer API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a wallet entry in the Explorer API v3 response. */
interface ExplorerWallet {
    id: string;
    name: string;
    image_id: string;
    mobile?: { native?: string; universal?: string };
}

interface ExplorerResponse {
    listings: Record<string, ExplorerWallet>;
}

/** Offline fallback — used as initial state so the UI is never empty. */
function buildFallbackEntries(): WalletDeepLinkEntry[] {
    const evm = EVM_KNOWN_ORDER.map((id) => ({
        id,
        name: EVM_FALLBACK_NAMES[id]!,
        imageUrl: "",
        buildLink: EVM_KNOWN_BUILDERS[id]!,
        featured: true,
        isSolana: false,
    }));
    return SHOW_SOL_WALLETS ? [...evm, ...SOL_FALLBACK_ENTRIES] : evm;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches mobile-capable wallets from the WalletConnect Explorer API and
 * builds deep-link entries.
 *
 * Strategy:
 * - EVM: `chains=eip155:1&platforms=ios,android` — dynamic list with curated
 *   known wallets pinned first, then any others from the API.
 * - Solana: targeted `/v3/all?ids=...` fetch for only the curated popular
 *   wallets (Phantom, Solflare, Backpack). No chain-filter fetch — the
 *   `chains=solana:...` filter returns many obscure/unknown wallets.
 * - Falls back to hardcoded offline list if the API is unreachable.
 */
export function useWalletDeepLinks() {
    const [entries, setEntries] =
        useState<WalletDeepLinkEntry[]>(buildFallbackEntries);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!APPKIT_PROJECT_ID) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                // Use `chains` filter instead of `sdks` — more accurate and includes
                // wallets that may not have explicitly registered their SDK version.
                const evmParams = new URLSearchParams({
                    projectId: APPKIT_PROJECT_ID,
                    platforms: "ios,android",
                    chains: "eip155:1",
                    entries: "25",
                    page: "1",
                });

                // Targeted Solana fetch: request only the known popular wallet IDs
                // via /v3/all?ids=... — avoids the chain filter which returns
                // many obscure/unpopular wallets.
                const solIds = SOL_KNOWN_ORDER.join(",");
                const solParams = new URLSearchParams({
                    projectId: APPKIT_PROJECT_ID,
                    ids: solIds,
                });

                // Fetch EVM and Solana wallets in parallel.
                const [evmRes, solRes] = await Promise.all([
                    fetch(`${EXPLORER_BASE}/v3/wallets?${evmParams}`),
                    SHOW_SOL_WALLETS
                        ? fetch(`${EXPLORER_BASE}/v3/all?${solParams}`)
                        : Promise.resolve(null),
                ]);

                if (!evmRes.ok) throw new Error(`Explorer EVM API ${evmRes.status}`);
                if (solRes && !solRes.ok)
                    throw new Error(`Explorer SOL API ${solRes.status}`);

                const [evmData, solData]: [ExplorerResponse, ExplorerResponse | null] =
                    await Promise.all([
                        evmRes.json() as Promise<ExplorerResponse>,
                        solRes
                            ? (solRes.json() as Promise<ExplorerResponse>)
                            : Promise.resolve(null),
                    ]);

                if (cancelled) return;

                // ── EVM entries ─────────────────────────────────────────────────────
                const evmResult: WalletDeepLinkEntry[] = [];

                for (const wallet of Object.values(evmData.listings)) {
                    const knownBuilder = EVM_KNOWN_BUILDERS[wallet.id];
                    if (knownBuilder) {
                        evmResult.push({
                            id: wallet.id,
                            name: wallet.name,
                            imageUrl: logoUrl(wallet.image_id),
                            buildLink: knownBuilder,
                            featured: true,
                            isSolana: false,
                        });
                        continue;
                    }

                    // Require both universal and native links as a signal that
                    // this is a real installed wallet app with an in-app browser,
                    // not just a web app or a link that opens the app store.
                    const universal = wallet.mobile?.universal;
                    const native = wallet.mobile?.native;
                    if (universal && native) {
                        evmResult.push({
                            id: wallet.id,
                            name: wallet.name,
                            imageUrl: logoUrl(wallet.image_id),
                            buildLink: (url) =>
                                `${universal}/dapp?url=${encodeURIComponent(url)}`,
                            featured: false,
                            isSolana: false,
                        });
                    }
                }

                evmResult.sort((a, b) => {
                    const ai = EVM_KNOWN_ORDER.indexOf(a.id);
                    const bi = EVM_KNOWN_ORDER.indexOf(b.id);
                    if (ai >= 0 && bi >= 0) return ai - bi;
                    if (ai >= 0) return -1;
                    if (bi >= 0) return 1;
                    return a.name.localeCompare(b.name);
                });

                // ── Solana entries ───────────────────────────────────────────────────
                const solResult: WalletDeepLinkEntry[] = [];

                if (solData) {
                    for (const wallet of Object.values(solData.listings)) {
                        const knownBuilder = SOL_KNOWN_BUILDERS[wallet.id];
                        // Only include wallets in the curated known list.
                        if (!knownBuilder) continue;
                        solResult.push({
                            id: wallet.id,
                            name: wallet.name,
                            imageUrl: logoUrl(wallet.image_id),
                            buildLink: knownBuilder,
                            featured: true, // All curated SOL wallets shown upfront
                            isSolana: true,
                        });
                    }

                    // Maintain curated display order (Phantom → Solflare → Backpack).
                    solResult.sort(
                        (a, b) => SOL_KNOWN_ORDER.indexOf(a.id) - SOL_KNOWN_ORDER.indexOf(b.id),
                    );
                }

                setEntries([...evmResult, ...solResult]);
            } catch {
                // Keep the initial fallback state — do not overwrite with empty.
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    return { entries, isLoading };
}
