import { useState } from "react";
import { useConnect } from "wagmi";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react";
import { InAppBrowserPrompt } from "@/components/common/in-app-browser-prompt";
import {
  isInAppWalletBrowser,
  isMobileBrowser,
} from "@/utils/helpers/mobile-browser";
import { claimActiveTab } from "@/hooks/useIsLeaderTab";
import { activeXphereNetwork } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";

const ConnectButton = () => {
  const { open } = useAppKit();
  const { connectAsync, connectors } = useConnect();
  const { switchNetwork } = useAppKitNetwork();
  const setPendingNetworkSwitch = useSystemStore(
    (s) => s.setPendingNetworkSwitch,
  );
  const [promptOpen, setPromptOpen] = useState(false);

  // On first connect, steer the wallet to the dApp's primary chain (Xphere).
  // For MODAL connects we reuse the existing pendingNetworkSwitch flow — the
  // root-level useAppKitEventHandler performs switchNetwork() on MODAL_CLOSE once
  // connected. switchNetwork() triggers wallet_addEthereumChain, so first-time
  // users get the "Add Xphere network" prompt. (Wallets that ignore addChain —
  // e.g. Trust's in-app browser — simply won't add it; nothing we can do there.)
  const queueXphereDefault = () =>
    setPendingNetworkSwitch({
      network: activeXphereNetwork,
      closeModalOnDone: false,
    });

  const handleConnect = async () => {
    // Claim the connection lifecycle for THIS tab so a MetaMask-Android duplicate
    // tab stays passive (the tab the user taps Connect in owns auth/signing).
    claimActiveTab();

    // CASE 1: already inside a mobile wallet's in-app browser (MetaMask, etc.).
    // Connect the INJECTED provider directly (calling open() here would re-deeplink
    // and spawn a second dapp instance). The modal path's MODAL_CLOSE never fires
    // here, so switch to Xphere ourselves right after connecting.
    if (isMobileBrowser() && isInAppWalletBrowser()) {
      const injected = connectors.find((c) => c.type === "injected");
      if (injected) {
        try {
          await connectAsync({ connector: injected });
          switchNetwork(activeXphereNetwork); // → add/switch Xphere prompt
        } catch {
          /* user rejected the connection / switch — nothing to do */
        }
        return;
      }
      // Solana-only in-app browser (e.g. Phantom) — use the modal, NOT the
      // redirect prompt (we're already inside a wallet browser).
      await open();
      return;
    }

    // CASE 2: mobile EXTERNAL browser — offer the in-app-browser redirect.
    if (isMobileBrowser()) {
      setPromptOpen(true);
      return;
    }

    // CASE 3: desktop — queue Xphere, then open the AppKit modal.
    queueXphereDefault();
    await open();
  };

  // "Continue Anyway" — dismiss the prompt and run the normal WC/AppKit flow,
  // queueing Xphere so it's switched-to once connected.
  const handleContinueAnyway = async () => {
    claimActiveTab();
    setPromptOpen(false);
    queueXphereDefault();
    await open();
  };

  return (
    <>
      <Button
        className={cn(
          "flex items-center",
          getVariantBorderClassName({ variant: "swap" }),
          getVariantBgClassName({ variant: "swap" }),
          "rounded-24px bg-transparent px-6 py-5.75 hover:bg-transparent",
        )}
        onClick={handleConnect}
      >
        <span className="text-15px font-semibold">CONNECT WALLET</span>
      </Button>

      <InAppBrowserPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onContinueAnyway={handleContinueAnyway}
      />
    </>
  );
};

export default ConnectButton;
