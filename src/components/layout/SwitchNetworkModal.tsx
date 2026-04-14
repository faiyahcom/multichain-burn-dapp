import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { Button } from "@/components/common/glow/button";
import { useSystemStore } from "@/stores/systemStore";
import { IconSwitchTo } from "@/assets/react";
import { cn } from "@/lib/utils";
import { getVariantBorderClassName, getVariantShadowClassName } from "../common/glow/container";

export function SwitchNetworkModal() {
  const { switchNetworkRequest, closeSwitchNetworkModal } = useSystemStore();
  const { switchNetwork } = useAppKitNetwork();
  const { open } = useAppKit();
  const { address: evmAddress } = useAppKitAccount({ namespace: "eip155" });
  const { address: solanaAddress } = useAppKitAccount({ namespace: "solana" });
  const fromNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === switchNetworkRequest?.fromId,
  );
  const toNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === switchNetworkRequest?.toId,
  );

  const setPendingNetworkSwitch = useSystemStore((s) => s.setPendingNetworkSwitch);

  const handleSwitch = async () => {
    if (!toNetwork) return;
    const targetNamespace = toNetwork.id === "solana" ? "solana" : "eip155";
    const alreadyConnectedToNamespace = targetNamespace === "solana" ? !!solanaAddress : !!evmAddress;
    try {
      if (alreadyConnectedToNamespace) {
        // Already connected to the target namespace — switch directly to the exact chain.
        await switchNetwork(toNetwork.appKitNetwork);
        closeSwitchNetworkModal();
      } else {
        // Not yet connected to the target namespace — open connect modal.
        // The root-level useAppKitEventHandler will finalise the switch on MODAL_CLOSE
        // and close this modal via closeModalOnDone: true.
        setPendingNetworkSwitch({ network: toNetwork.appKitNetwork, closeModalOnDone: true });
        open({ view: "Connect", namespace: targetNamespace });
      }
    } catch {
      setPendingNetworkSwitch(null);
      closeSwitchNetworkModal();
    }
  };

  return (
    <Dialog
      open={switchNetworkRequest !== null}
      onOpenChange={(open) => !open && closeSwitchNetworkModal()}
    >
      <DialogContent
        className={cn("sm:max-w-160 bg-background",
          getVariantBorderClassName({ variant: "pair" }),
          getVariantShadowClassName({ variant: "pair" }),
        )}
      showCloseButton={false}
      onEscapeKeyDown={closeSwitchNetworkModal}
      >
      <DialogHeader>
        <div className="mb-4 flex items-center justify-center gap-6">
          {fromNetwork ? (
            <img
              src={fromNetwork.iconSrc}
              alt={fromNetwork.label}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-inactive" />
          )}
          <IconSwitchTo />
          {toNetwork ? (
            <img
              src={toNetwork.iconSrc}
              alt={toNetwork.label}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-inactive" />
          )}
        </div>
        <DialogTitle className="text-center mb-1 text-2xl font-bold">
          Change Network
        </DialogTitle>
        <DialogDescription className="text-center font-inter">
          Switch to{" "}
          <span className="font-bold text-active">
            {toNetwork?.label ?? switchNetworkRequest?.toId}
          </span>{" "}
          to use the wallet
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex gap-4 sm:justify-center">
        <Button
          variant="pair-active"
          hasHover
          className="flex-1 font-orbitron font-semibold sm:min-w-60.25 sm:text-xl xl:text-2xl"
          onClick={closeSwitchNetworkModal}
        >
          No
        </Button>
        <Button
          variant="pair"
          hasHover
          className="flex-1 font-orbitron font-semibold sm:min-w-60.25 sm:text-xl xl:text-2xl"
          onClick={handleSwitch}
        >
          Switch Network
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog >
  );
}
