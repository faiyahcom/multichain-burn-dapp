import { useState } from "react";
import { useConnect } from "wagmi";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppKit } from "@reown/appkit/react";
import { InAppBrowserPrompt } from "@/components/common/in-app-browser-prompt";
import {
  isInAppWalletBrowser,
  isMobileBrowser,
} from "@/utils/helpers/mobile-browser";
import { claimActiveTab } from "@/hooks/useIsLeaderTab";

const ConnectButton = () => {
  const { open } = useAppKit();
  const { connect, connectors } = useConnect();
  const [promptOpen, setPromptOpen] = useState(false);

  const handleConnect = async () => {
    // Claim the connection lifecycle for THIS tab so a MetaMask-Android duplicate
    // tab stays passive (the tab the user taps Connect in owns auth/signing).
    claimActiveTab();

    // CASE 1: already inside a mobile wallet's in-app browser (MetaMask, etc.).
    // Connect the INJECTED provider directly (calling open() here would re-deeplink
    // and spawn a second dapp instance). We do NOT force any network switch here:
    // forcing wallet_addEthereumChain for the custom Xphere chain crashes MetaMask
    // mobile ("View: Root, TypeError: undefined is not a function") — in the in-app
    // browser too, not just over WalletConnect. Xphere is switched ON DEMAND via
    // NetworkSelect / SwitchNetworkModal when the user actually needs it.
    if (isMobileBrowser() && isInAppWalletBrowser()) {
      const injected = connectors.find((c) => c.type === "injected");
      if (injected) {
        connect({ connector: injected });
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

    // CASE 3: desktop — normal AppKit modal (no forced switch; the modal may end
    // up as a WalletConnect session to a mobile wallet, where a forced add crashes).
    await open();
  };

  // "Continue Anyway" — dismiss the prompt and run the normal WC/AppKit flow.
  // No forced switch (this path is WalletConnect on mobile — see CASE 1 note).
  const handleContinueAnyway = async () => {
    claimActiveTab();
    setPromptOpen(false);
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
