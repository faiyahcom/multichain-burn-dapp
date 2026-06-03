import { useEffect, useState } from "react";

const ACTIVE_TAB_KEY = "wallet-active-tab";
// Same-tab notification: localStorage `storage` events fire in OTHER tabs only,
// so we dispatch this window event to update the claiming tab itself.
const CLAIM_EVENT = "wallet-active-tab:claim";

// Stable id for THIS browser tab (one per JS context).
let cachedTabId: string | null = null;
function getTabId(): string {
  if (cachedTabId) return cachedTabId;
  cachedTabId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return cachedTabId;
}

function readOwner(): string | null {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY);
  } catch {
    return null;
  }
}

/**
 * Mark THIS tab as the active one. Call when the user initiates a connection so
 * the tab they're actually using owns the wallet lifecycle — this is the signal
 * that survives MetaMask's duplicate-tab bug, because only the tab the user
 * tapped Connect in claims ownership.
 */
export function claimActiveTab(): void {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, getTabId());
  } catch {
    /* storage unavailable */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLAIM_EVENT));
  }
}

/**
 * Returns true when THIS tab owns the wallet connection lifecycle (auth,
 * disconnect, network sync).
 *
 * Why: MetaMask on Android spawns DUPLICATE dapp tabs (deeplink bug), and
 * WalletConnect/wagmi share one session across all tabs of the origin. If every
 * tab ran the lifecycle they'd race — duplicate signature prompts and responses
 * landing in the wrong tab ("signing gone wrong").
 *
 * Mechanism: a shared localStorage key holds the id of the active tab. Unlike
 * the Web Locks API it works in every WebView, and ownership FOLLOWS THE USER:
 * a tab claims on connect (claimActiveTab) and on becoming visible/focused, and
 * all tabs converge by reading the shared key on every `storage` event. The tab
 * the user is driving wins; the duplicate stays passive.
 */
export function useIsLeaderTab(): boolean {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const tabId = getTabId();

    const claim = () => {
      try {
        localStorage.setItem(ACTIVE_TAB_KEY, tabId);
      } catch {
        /* storage blocked → behave as sole tab */
      }
      setIsActive(true);
    };

    // Reflect the shared owner. Reading the key (not the event's newValue) avoids
    // stale-ordering races when two tabs claim near-simultaneously.
    const resync = () => {
      const owner = readOwner();
      if (owner === null) {
        if (document.visibilityState === "visible") claim();
        return;
      }
      setIsActive(owner === tabId);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_TAB_KEY) resync();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") claim();
    };
    const onLocalClaim = () => setIsActive(readOwner() === tabId);

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", claim);
    window.addEventListener(CLAIM_EVENT, onLocalClaim);

    // Initial: a visible tab claims; a hidden tab reflects the current owner.
    if (document.visibilityState === "visible") claim();
    else resync();

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", claim);
      window.removeEventListener(CLAIM_EVENT, onLocalClaim);
    };
  }, []);

  return isActive;
}
