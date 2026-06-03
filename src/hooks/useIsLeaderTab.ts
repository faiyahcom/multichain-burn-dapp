import { useEffect, useState } from "react";

const LEADER_LOCK_NAME = "wallet-connection-leader";

/**
 * Returns true when THIS tab is the elected leader that owns the wallet
 * connection lifecycle (auth, disconnect, network sync).
 *
 * Why this exists: MetaMask on Android has a deeplink bug that spawns DUPLICATE
 * dapp tabs (MetaMask/metamask-mobile#5831, #3646). WalletConnect/wagmi share a
 * single session across all tabs of the origin, so if every tab ran the auth
 * lifecycle they'd race — duplicate signature prompts and requests landing in
 * the wrong tab ("signing gone wrong"). Electing a single leader prevents that.
 *
 * Mechanism: the Web Locks API. Exactly one tab can hold an exclusive lock at a
 * time. Leadership FOLLOWS VISIBILITY — a tab contends for the lock while it's
 * visible and releases it when hidden — so the foreground tab is always the
 * actor. That matters in MetaMask's in-app browser, where only one duplicate
 * tab is on-screen at a time; the visible one leads, the hidden one stays
 * passive. If two tabs are visible at once (e.g. desktop side-by-side), the
 * lock still guarantees exactly one leader.
 *
 * Fallback: if Web Locks is unavailable, the tab is always leader (single-tab
 * assumption) so behaviour is unchanged on legacy browsers.
 */
export function useIsLeaderTab(): boolean {
  const hasLocks =
    typeof navigator !== "undefined" && "locks" in navigator;
  const [isLeader, setIsLeader] = useState(!hasLocks);

  useEffect(() => {
    if (!hasLocks) return;

    // `abort` cancels a still-pending lock request; `resolveHold` releases a
    // lock we currently hold (resolving the request callback's promise).
    let abort: AbortController | null = null;
    let resolveHold: (() => void) | null = null;

    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      if (abort) return; // already contending or holding
      abort = new AbortController();
      navigator.locks
        .request(
          LEADER_LOCK_NAME,
          { mode: "exclusive", signal: abort.signal },
          () =>
            // Hold the lock (and leadership) until we explicitly release it.
            new Promise<void>((resolve) => {
              setIsLeader(true);
              resolveHold = resolve;
            }),
        )
        .catch(() => {
          // Aborted (we gave up while still pending) or failed — not leader.
        });
    };

    const release = () => {
      setIsLeader(false);
      if (resolveHold) {
        resolveHold(); // release held lock → a waiting tab can become leader
        resolveHold = null;
      } else if (abort) {
        abort.abort(); // cancel a request that hadn't acquired yet
      }
      abort = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") acquire();
      else release();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    acquire();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      release();
    };
  }, [hasLocks]);

  return isLeader;
}
