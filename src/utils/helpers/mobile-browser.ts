/**
 * Utilities for detecting mobile and wallet in-app browsers.
 * Follows PancakeSwap's hostDetection architecture.
 */

/** Identifies which wallet's in-app browser the user is currently in. */
export enum WalletHost {
  Unknown = "Unknown",
  // EVM
  Metamask = "Metamask",
  Trust = "Trust",
  Coinbase = "Coinbase",
  Okx = "Okx",
  BinanceW3W = "BinanceW3W",
  // Solana
  Phantom = "Phantom",
  Solflare = "Solflare",
  Backpack = "Backpack",
}

/** The result of wallet browser host detection. */
export interface WalletBrowserDetection {
  isWalletApp: boolean;
  host: WalletHost;
}

const DEFAULT_DETECTION: WalletBrowserDetection = {
  isWalletApp: false,
  host: WalletHost.Unknown,
};

/** Returns true when running on a mobile device (iOS or Android). */
export function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Detects the current wallet browser host via user-agent string.
 *
 * UA pattern priority follows PancakeSwap's hostDetection:
 *  1. MetaMaskMobile
 *  2. Trust Wallet
 *  3. CoinbaseWallet
 *  4. OKX (UA + window.okxwallet provider check)
 *
 * Additional wallets (Rainbow, TokenPocket, imToken, BitKeep/Bitget) are
 * detected as `{ isWalletApp: true, host: WalletHost.Unknown }` so the
 * redirect prompt is still suppressed for users already in those browsers.
 */
export function detectWalletBrowser(): WalletBrowserDetection {
  if (typeof navigator === "undefined") return DEFAULT_DETECTION;
  const ua = navigator.userAgent;

  if (/MetaMaskMobile/i.test(ua))
    return { isWalletApp: true, host: WalletHost.Metamask };
  if (/Trust Wallet/i.test(ua))
    return { isWalletApp: true, host: WalletHost.Trust };
  if (/CoinbaseWallet/i.test(ua))
    return { isWalletApp: true, host: WalletHost.Coinbase };
  if (/OKX/i.test(ua) && detectOkxProvider())
    return { isWalletApp: true, host: WalletHost.Okx };

  // Other EVM wallet browsers — catch-all for wallets not covered above.
  if (/Rainbow|TokenPocket|imToken|BitKeep|Bitget/i.test(ua))
    return { isWalletApp: true, host: WalletHost.Unknown };

  // Solana wallets do NOT set a reliable UA string.
  // Detection is handled generically via hasSolanaWalletProvider() in
  // isInAppWalletBrowser(), which checks window.phantom / window.solflare /
  // window.backpack etc. — no UA hardcoding needed.

  return DEFAULT_DETECTION;
}

/** Checks for the OKX wallet provider injection. SSR-safe. */
function detectOkxProvider(): boolean {
  try {
    return typeof window !== "undefined" && "okxwallet" in window;
  } catch {
    return false;
  }
}

/**
 * Checks for Solana wallet provider injections.
 *
 * Solana wallets (Phantom, Solflare, Backpack) do not reliably set a
 * distinctive UA string — they identify themselves via window providers.
 * This check is the authoritative signal for those browsers.
 */
function hasSolanaWalletProvider(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const w = window as typeof window & {
      phantom?: { solana?: { isPhantom?: boolean } };
      solana?: { isPhantom?: boolean };
      solflare?: { isSolflare?: boolean };
      backpack?: unknown;
      xnft?: unknown;
      glow?: unknown;
    };
    return !!(
      w.phantom?.solana?.isPhantom ||
      w.solana?.isPhantom ||
      w.solflare?.isSolflare ||
      w.backpack ||
      w.xnft ||
      w.glow
    );
  } catch {
    return false;
  }
}

/**
 * Detects a connected wallet by its injected window provider.
 * Follows PancakeSwap's detectInjectedWalletByProvider pattern.
 * Returns the WalletHost if a known provider is found, or null otherwise.
 */
export function detectInjectedWalletByProvider(): WalletHost | null {
  try {
    if (typeof window === "undefined") return null;
    const w = window as typeof window & {
      // EVM
      okxwallet?: unknown;
      binancew3w?: unknown;
      ethereum?: {
        isMetaMask?: boolean;
        isBinance?: boolean;
        isCoinbaseWallet?: boolean;
      };
      // Solana
      phantom?: { solana?: { isPhantom?: boolean } };
      solana?: { isPhantom?: boolean };
      solflare?: { isSolflare?: boolean };
      backpack?: unknown;
      xnft?: unknown;
    };
    // EVM providers
    if (w.okxwallet) return WalletHost.Okx;
    if (w.ethereum?.isBinance || w.binancew3w) return WalletHost.BinanceW3W;
    if (w.ethereum?.isMetaMask && !w.ethereum?.isBinance)
      return WalletHost.Metamask;
    if (w.ethereum?.isCoinbaseWallet) return WalletHost.Coinbase;
    // Solana providers
    if (w.phantom?.solana?.isPhantom || w.solana?.isPhantom)
      return WalletHost.Phantom;
    if (w.solflare?.isSolflare) return WalletHost.Solflare;
    if (w.backpack || w.xnft) return WalletHost.Backpack;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true when the current browser is a wallet's built-in browser.
 *
 * Combines three signals so the prompt is correctly suppressed whenever the
 * user is already inside any wallet's browser:
 *  1. UA patterns            — EVM wallets that set a distinctive UA string.
 *  2. EVM injected provider  — covers wallets whose UA string drifts across
 *                              app versions but still inject window.ethereum
 *                              (e.g. MetaMask/Coinbase builds the UA regex misses).
 *  3. Solana injected provider — Solana wallets set no distinctive UA at all.
 */
export function isInAppWalletBrowser(): boolean {
  return (
    detectWalletBrowser().isWalletApp ||
    detectInjectedWalletByProvider() !== null ||
    hasSolanaWalletProvider()
  );
}

/**
 * Returns true when the user is on a mobile device but NOT inside a
 * wallet's in-app browser — i.e. the redirect prompt should be shown.
 */
export function shouldShowInAppBrowserPrompt(): boolean {
  return isMobileBrowser() && !isInAppWalletBrowser();
}
