import { useState, useEffect } from "react";
import { APPKIT_PROJECT_ID } from "@/config/constant";

// ─── Dev toggle ──────────────────────────────────────────────────────────────
/**
 * Set to `true` to include Solana wallet options in the in-app browser prompt.
 * Phantom and Solflare will appear in a dedicated "Solana" section below the
 * EVM wallet grid.
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

/**
 * Known wallets with wallet-specific dApp browser URL formats.
 * These differ from the generic `{universal}/dapp?url=` pattern.
 */
const KNOWN_BUILDERS: Record<string, (url: string) => string> = {
  // MetaMask — c57ca9...
  c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96: (url) => {
    const { hostname, pathname, search } = new URL(url);
    return `https://metamask.app.link/dapp/${hostname}${pathname}${search}`;
  },
  // Trust Wallet — 4622a2...
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0": (url) =>
    `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
  // Coinbase Wallet — fd20dc...
  fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa: (url) =>
    `https://go.cb-wallet.com/dapp?url=${encodeURIComponent(url)}`,
  // Rainbow — 1ae92b...
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369": (url) =>
    `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
  // OKX Wallet — 971e68...
  "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709": (url) =>
    `https://www.okx.com/download?deeplink=${encodeURIComponent(`okx://wallet/dapp/url?dappUrl=${encodeURIComponent(url)}`)}`,
};

const KNOWN_ORDER = Object.keys(KNOWN_BUILDERS);

const FALLBACK_NAMES: Record<string, string> = {
  c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96: "MetaMask",
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0":
    "Trust Wallet",
  fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa:
    "Coinbase Wallet",
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369":
    "Rainbow",
  "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709":
    "OKX Wallet",
};

/**
 * Solana wallet entries — hardcoded because the WC Explorer `sign_v2` filter
 * excludes most Solana-only wallets.
 *
 * Both wallets use their official Universal Link browse URL scheme:
 *   Phantom:  phantom.app/ul/browse/{encodedUrl}?ref={encodedHost}
 *   Solflare: solflare.com/ul/v1/browse/{encodedUrl}?ref={encodedHost}
 */
const SOL_WALLET_ENTRIES: WalletDeepLinkEntry[] = [
  {
    id: "sol-phantom",
    name: "Phantom",
    imageUrl: "",
    buildLink: (url) => {
      const ref = encodeURIComponent(new URL(url).hostname);
      return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${ref}`;
    },
    featured: true,
    isSolana: true,
  },
  {
    id: "sol-solflare",
    name: "Solflare",
    imageUrl: "",
    buildLink: (url) => {
      const ref = encodeURIComponent(new URL(url).hostname);
      return `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${ref}`;
    },
    featured: true,
    isSolana: true,
  },
];

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

/** Offline fallback — known wallets with no images. */
function buildFallbackEntries(): WalletDeepLinkEntry[] {
  const evm = KNOWN_ORDER.map((id) => ({
    id,
    name: FALLBACK_NAMES[id]!,
    imageUrl: "",
    buildLink: KNOWN_BUILDERS[id]!,
    featured: true,
    isSolana: false,
  }));
  return SHOW_SOL_WALLETS ? [...evm, ...SOL_WALLET_ENTRIES] : evm;
}

/**
 * Fetches mobile-capable wallets from the WalletConnect Explorer API and
 * builds deep-link entries for each one.
 *
 * Strategy:
 * - Known wallets → their specific dApp-browser URL builder (correct format).
 * - Other wallets that expose `mobile.universal` → generic
 *   `{universal}/dapp?url={encodedUrl}` pattern supported by most EVM wallets.
 *
 * Sort order: known wallets first (in defined order), then alphabetical.
 * Falls back to the hardcoded known-wallet list if the API is unreachable.
 */
export function useWalletDeepLinks() {
  // Start with fallback so the UI is never empty while loading.
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
        const params = new URLSearchParams({
          projectId: APPKIT_PROJECT_ID,
          platforms: "ios,android",
          entries: "25",
          page: "1",
          sdks: "sign_v2",
        });

        const res = await fetch(
          `${EXPLORER_BASE}/v3/wallets?${params.toString()}`,
        );
        if (!res.ok) throw new Error(`Explorer API ${res.status}`);

        const data: ExplorerResponse = await res.json();
        if (cancelled) return;

        const result: WalletDeepLinkEntry[] = [];

        for (const wallet of Object.values(data.listings)) {
          const knownBuilder = KNOWN_BUILDERS[wallet.id];
          if (knownBuilder) {
            result.push({
              id: wallet.id,
              name: wallet.name,
              imageUrl: logoUrl(wallet.image_id),
              buildLink: knownBuilder,
              featured: true,
              isSolana: false,
            });
            continue;
          }

          // Generic fallback: most modern EVM wallets open their browser at
          // `{universal}/dapp?url={encoded}`.
          const universal = wallet.mobile?.universal;
          if (universal) {
            result.push({
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

        result.sort((a, b) => {
          const ai = KNOWN_ORDER.indexOf(a.id);
          const bi = KNOWN_ORDER.indexOf(b.id);
          if (ai >= 0 && bi >= 0) return ai - bi;
          if (ai >= 0) return -1;
          if (bi >= 0) return 1;
          return a.name.localeCompare(b.name);
        });

        // Append Solana entries after all EVM entries when the toggle is on.
        if (SHOW_SOL_WALLETS) {
          result.push(...SOL_WALLET_ENTRIES);
        }

        setEntries(result);
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
