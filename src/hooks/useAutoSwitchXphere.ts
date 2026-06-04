import { useEffect, useRef } from "react";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { activeXphereNetwork } from "@/config/networks";
import {
  isInAppWalletBrowser,
  isMobileBrowser,
} from "@/utils/helpers/mobile-browser";
import { useSystemStore } from "@/stores/systemStore";

// Delay before firing the switch, so the wallet's in-app provider has finished
// initializing the freshly-connected session. Firing immediately on connect
// crashes MetaMask mobile ("View: Root, TypeError: undefined is not a function")
// because its network/provider state isn't ready yet; a manual switch works only
// because it happens later. This deferral mimics that later timing.
const SETTLE_DELAY_MS = 2000;

/**
 * In a mobile wallet's IN-APP BROWSER (injected provider), switch to Xphere a
 * short while AFTER the connection settles — never during the connect handshake.
 *
 * Gated to: mobile in-app wallet browser only, EVM connection, not already on
 * Xphere, no user-initiated pending switch, and once per connection. Deliberately
 * NOT used for WalletConnect / desktop (forcing a custom-chain add there is the
 * crash path, and on-demand switching covers those).
 */
export function useAutoSwitchXphere() {
  const { isConnected, caipAddress } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();

  const switchNetworkRef = useRef(switchNetwork);
  useEffect(() => {
    switchNetworkRef.current = switchNetwork;
  }, [switchNetwork]);

  // Ensures we only attempt the switch once per connection (reset on disconnect).
  const doneForConnection = useRef(false);

  useEffect(() => {
    if (!isConnected || !caipAddress) {
      doneForConnection.current = false;
      return;
    }
    if (doneForConnection.current) return;

    // Only inside a mobile wallet's in-app browser (the injected path).
    if (!(isMobileBrowser() && isInAppWalletBrowser())) return;

    const [namespace, chainRef] = caipAddress.split(":");
    if (namespace !== "eip155") return; // EVM only
    if (Number(chainRef) === Number(activeXphereNetwork.id)) return; // already there

    // Defer to an explicit user-initiated switch (NetworkSelect / SwitchNetworkModal).
    if (useSystemStore.getState().pendingNetworkSwitch) return;

    doneForConnection.current = true;
    const timer = setTimeout(() => {
      // Re-check just before firing — the user may have started their own switch.
      if (useSystemStore.getState().pendingNetworkSwitch) return;
      switchNetworkRef.current(activeXphereNetwork);
    }, SETTLE_DELAY_MS);

    // If the chain/account genuinely changes during the settle window (e.g. the
    // user switched manually), cancel — their choice wins, no forced Xphere.
    return () => clearTimeout(timer);
  }, [isConnected, caipAddress]);
}
