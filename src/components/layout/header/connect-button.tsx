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

const ConnectButton = () => {
  const { open } = useAppKit();
  const { connect, connectors } = useConnect();
  const [promptOpen, setPromptOpen] = useState(false);

  const handleConnect = async () => {
    // CASE 1: already inside a mobile wallet's in-app browser (MetaMask, etc.).
    // Connect the INJECTED provider directly. Do NOT call open() here — AppKit's
    // modal would re-deeplink to the same wallet (metamask://wc?...), spawning a
    // SECOND dapp instance inside the wallet. The two instances then share one
    // origin's WalletConnect storage → split session → "opens 2 links" and the
    // signature request lands in the wrong instance ("signing gone wrong").
    if (isMobileBrowser() && isInAppWalletBrowser()) {
      const injected = connectors.find((c) => c.type === "injected");
      if (injected) {
        connect({ connector: injected });
        return;
      }
      // No injected EVM connector (e.g. a Solana-only in-app browser like
      // Phantom) — use the AppKit modal, NOT the redirect prompt (we're already
      // inside a wallet browser, so redirecting again makes no sense).
      await open();
      return;
    }

    // CASE 2: mobile EXTERNAL browser — offer the in-app-browser redirect.
    if (isMobileBrowser()) {
      setPromptOpen(true);
      return;
    }

    // CASE 3: desktop — normal AppKit modal (choose among wallets/extensions).
    await open();
  };

  // "Continue Anyway" — dismiss the prompt and run the normal connect flow.
  const handleContinueAnyway = async () => {
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
