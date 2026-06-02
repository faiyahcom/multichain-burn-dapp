import { useState } from "react";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppKit } from "@reown/appkit/react";
import { InAppBrowserPrompt } from "@/components/common/in-app-browser-prompt";
import { shouldShowInAppBrowserPrompt } from "@/utils/helpers/mobile-browser";

const ConnectButton = () => {
  const { open } = useAppKit();
  const [promptOpen, setPromptOpen] = useState(false);

  const handleConnect = async () => {
    // On a mobile external browser, offer the in-app-browser redirect first.
    // Everywhere else (desktop, or already inside a wallet's in-app browser),
    // go straight to the normal connect flow.
    if (shouldShowInAppBrowserPrompt()) {
      setPromptOpen(true);
      return;
    }
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
