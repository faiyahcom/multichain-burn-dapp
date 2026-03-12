import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useAppKitNetwork } from "@reown/appkit/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { ArrowIcon } from "@/components/common/arrow-icon";
import { useSystemStore } from "@/stores/systemStore";

export function SwitchNetworkModal() {
  const { switchNetworkRequest, closeSwitchNetworkModal } = useSystemStore();
  const { switchNetwork } = useAppKitNetwork();

  const fromNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === switchNetworkRequest?.fromId,
  );
  const toNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === switchNetworkRequest?.toId,
  );

  const handleSwitch = async () => {
    if (!toNetwork) return;
    try {
      await switchNetwork(toNetwork.appKitNetwork);
    } catch {
      // user rejected or wallet error — close the modal either way
    }
    closeSwitchNetworkModal();
  };

  return (
    <Dialog
      open={switchNetworkRequest !== null}
      onOpenChange={(open) => !open && closeSwitchNetworkModal()}
    >
      <DialogContent
        className="sm:max-w-160"
        showCloseButton
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
            <ArrowIcon
              direction="right"
              className="text-2xl text-mb-submit-border"
            />
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
          <DialogTitle className="text-center text-2xl font-bold">
            Change Network
          </DialogTitle>
          <DialogDescription className="text-center">
            Switch to{" "}
            <span className="font-bold text-active">
              {toNetwork?.label ?? switchNetworkRequest?.toId}
            </span>{" "}
            to use the wallet
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-4.75 sm:justify-center">
          <AnimateIconButton
            variant="letter-icon"
            iconLetter="N"
            textVariant="text-container-center"
            text="No"
            color="#FF8E8E"
            classNames={{
              btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive after:text-xl font-medium",
              icon: "size-8 text-xl",
              text: "text-xl",
            }}
            btnProps={{ onClick: closeSwitchNetworkModal }}
          />
          <AnimateIconButton
            variant="letter-icon"
            iconLetter="S"
            textVariant="text-self-center"
            text="Switch Network"
            color="#9072F9"
            classNames={{
              btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border after:text-xl font-medium",
              icon: "size-8 text-xl",
              text: "text-xl",
            }}
            btnProps={{ onClick: handleSwitch }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}