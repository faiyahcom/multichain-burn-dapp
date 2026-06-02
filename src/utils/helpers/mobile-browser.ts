/**
 * Utilities for detecting mobile and wallet in-app browsers.
 * Follows PancakeSwap's hostDetection architecture.
 */

/** Identifies which wallet's in-app browser the user is currently in. */
export enum WalletHost {
  Unknown = "Unknown",
  Metamask = "Metamask",
  Trust = "Trust",
  Coinbase = "Coinbase",
  Okx = "Okx",
  BinanceW3W = "BinanceW3W",
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

  // Additional wallets not in PancakeSwap's detection but supported here.
  if (/Rainbow|TokenPocket|imToken|BitKeep|Bitget/i.test(ua))
    return { isWalletApp: true, host: WalletHost.Unknown };

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
 * Detects a connected wallet by its injected window provider.
 * Follows PancakeSwap's detectInjectedWalletByProvider pattern.
 * Returns the WalletHost if a known provider is found, or null otherwise.
 */
export function detectInjectedWalletByProvider(): WalletHost | null {
  try {
    if (typeof window === "undefined") return null;
    const w = window as typeof window & {
      okxwallet?: unknown;
      binancew3w?: unknown;
      ethereum?: {
        isMetaMask?: boolean;
        isBinance?: boolean;
        isCoinbaseWallet?: boolean;
      };
    };
    if (w.okxwallet) return WalletHost.Okx;
    if (w.ethereum?.isBinance || w.binancew3w) return WalletHost.BinanceW3W;
    if (w.ethereum?.isMetaMask && !w.ethereum?.isBinance)
      return WalletHost.Metamask;
    if (w.ethereum?.isCoinbaseWallet) return WalletHost.Coinbase;
    return null;
  } catch {
    return null;
  }
}

/** Returns true when the current browser is a wallet's built-in browser. */
export function isInAppWalletBrowser(): boolean {
  return detectWalletBrowser().isWalletApp;
}

/**
 * Returns true when the user is on a mobile device but NOT inside a
 * wallet's in-app browser — i.e. the redirect prompt should be shown.
 */
export function shouldShowInAppBrowserPrompt(): boolean {
  return isMobileBrowser() && !isInAppWalletBrowser();
}
