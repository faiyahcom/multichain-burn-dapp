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
// Curated wallet registry
//
// There is NO universal deeplink standard for "open this dApp URL in wallet X's
// in-app browser" — the browse-link format is wallet-specific. So every entry
// here carries an explicitly verified `buildLink`; this guarantees that each
// tile in the prompt lands in a working in-app browser.
//
// To broaden coverage, add ONE object below with the wallet's Explorer listing
// ID + a verified browse-link builder. (The truly long tail of wallets is
// covered by the AppKit "Connect Wallet" deeplink path in the prompt, which
// needs no per-wallet maintenance.)
// ─────────────────────────────────────────────────────────────────────────────

type LinkBuilder = (url: string) => string;

const enc = encodeURIComponent;
const hostOf = (url: string) => new URL(url).hostname;

/**
 * Solana Mobile Stack universal-link browse scheme, shared by SMS-compliant
 * wallets: `{base}/ul/v1/browse/{encodedUrl}?ref={host}`.
 */
const smsBrowse =
  (base: string): LinkBuilder =>
  (url) =>
    `${base}/ul/v1/browse/${enc(url)}?ref=${enc(hostOf(url))}`;

interface CuratedWallet {
  /** WalletConnect Explorer listing ID — hydrates name + logo from the API. */
  id: string;
  /** Offline display name, used until the Explorer API responds. */
  name: string;
  /** Builds the wallet-specific in-app-browser deeplink. */
  buildLink: LinkBuilder;
  isSolana: boolean;
}

const CURATED_WALLETS: CuratedWallet[] = [
  // ── EVM ──────────────────────────────────────────────────────────────────
  {
    id: "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    name: "MetaMask",
    isSolana: false,
    buildLink: (url) => {
      const { hostname, pathname, search } = new URL(url);
      return `https://metamask.app.link/dapp/${hostname}${pathname}${search}`;
    },
  },
  {
    id: "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    name: "Trust Wallet",
    isSolana: false,
    buildLink: (url) =>
      `https://link.trustwallet.com/open_url?coin_id=60&url=${enc(url)}`,
  },
  {
    id: "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
    name: "Coinbase Wallet",
    isSolana: false,
    buildLink: (url) => `https://go.cb-wallet.com/dapp?url=${enc(url)}`,
  },
  {
    id: "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369",
    name: "Rainbow",
    isSolana: false,
    buildLink: (url) => `https://rnbwapp.com/dapp?url=${enc(url)}`,
  },
  {
    id: "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709",
    name: "OKX Wallet",
    isSolana: false,
    buildLink: (url) =>
      `https://www.okx.com/download?deeplink=${enc(`okx://wallet/dapp/url?dappUrl=${enc(url)}`)}`,
  },
  {
    // Bitget Wallet — HTTPS universal link (falls back to a web page if the app
    // isn't installed). Docs: web3.bitget.com/en/docs/configuration/deeplink
    id: "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662",
    name: "Bitget Wallet",
    isSolana: false,
    buildLink: (url) => `https://bkcode.vip?action=dapp&url=${enc(url)}`,
  },
  {
    // TokenPocket — custom scheme. Docs: help.tokenpocket.pro/developer-en
    id: "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66",
    name: "TokenPocket",
    isSolana: false,
    buildLink: (url) =>
      `tpdapp://open?params=${enc(JSON.stringify({ url, chain: "Ethereum" }))}`,
  },
  {
    // imToken — custom scheme. Docs: token.im developer deeplink reference.
    id: "ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef",
    name: "imToken",
    isSolana: false,
    buildLink: (url) => `imtokenv2://navigate/DappView?url=${enc(url)}`,
  },
  // ── Solana ─────────────────────────────────────────────────────────────────
  {
    id: "a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393",
    name: "Phantom",
    isSolana: true,
    // Phantom uses /ul/browse (no version segment), unlike the SMS /ul/v1/browse.
    buildLink: (url) =>
      `https://phantom.app/ul/browse/${enc(url)}?ref=${enc(hostOf(url))}`,
  },
  {
    id: "1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79",
    name: "Solflare",
    isSolana: true,
    buildLink: smsBrowse("https://solflare.com"),
  },
  {
    id: "2bd8c14e035c2d48f184aaa168559e86b0e3433228d3c4075900a221785019b0",
    name: "Backpack",
    isSolana: true,
    buildLink: smsBrowse("https://backpack.app"),
  },
];

/** Curated wallets active given the current SHOW_SOL_WALLETS toggle. */
const activeCurated = () =>
  SHOW_SOL_WALLETS
    ? CURATED_WALLETS
    : CURATED_WALLETS.filter((w) => !w.isSolana);

// ─────────────────────────────────────────────────────────────────────────────
// Explorer API helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a wallet entry in the Explorer API v3 response. */
interface ExplorerWallet {
  id: string;
  name: string;
  image_id: string;
}

interface ExplorerResponse {
  listings: Record<string, ExplorerWallet>;
}

/** Offline fallback — used as initial state so the UI is never empty. */
function buildFallbackEntries(): WalletDeepLinkEntry[] {
  return activeCurated().map((w) => ({
    id: w.id,
    name: w.name,
    imageUrl: "",
    buildLink: w.buildLink,
    featured: true,
    isSolana: w.isSolana,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hydrates the curated wallet registry with live names + logos from the
 * WalletConnect Explorer API.
 *
 * - A single `/v3/all?ids=...` fetch scoped to the curated IDs. Only wallets
 *   with a verified `buildLink` in CURATED_WALLETS are ever shown, so every
 *   entry is guaranteed to have a working in-app browser URL.
 * - Falls back to the hardcoded offline list if the API is unreachable.
 * - Only runs when `enabled` (the prompt is open) to avoid a needless Explorer
 *   API call on every page load, including desktop where the prompt never shows.
 */
export function useWalletDeepLinks(enabled = true) {
  const [entries, setEntries] =
    useState<WalletDeepLinkEntry[]>(buildFallbackEntries);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    if (!APPKIT_PROJECT_ID) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const curated = activeCurated();
        const params = new URLSearchParams({
          projectId: APPKIT_PROJECT_ID,
          ids: curated.map((w) => w.id).join(","),
        });

        const res = await fetch(`${EXPLORER_BASE}/v3/all?${params}`);
        if (!res.ok) throw new Error(`Explorer API ${res.status}`);

        const data = (await res.json()) as ExplorerResponse;
        if (cancelled) return;

        // Preserve curated order. We keep the curated display name (the registry
        // occasionally renames entries, e.g. "Base (formerly Coinbase Wallet)")
        // and only pull the logo from the API, falling back to no logo when the
        // wallet isn't returned.
        const hydrated = curated.map<WalletDeepLinkEntry>((w) => {
          const listing = data.listings[w.id];
          return {
            id: w.id,
            name: w.name,
            imageUrl: listing ? logoUrl(listing.image_id) : "",
            buildLink: w.buildLink,
            featured: true,
            isSolana: w.isSolana,
          };
        });

        setEntries(hydrated);
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
  }, [enabled]);

  return { entries, isLoading };
}
