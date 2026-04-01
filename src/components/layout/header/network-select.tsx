import {
  contentClassName,
  itemClassName,
  leftSelectedPanelClassName,
} from "@/components/common/glow/dropdown-menu-classnames";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appKit } from "@/config/appkit";
import { NETWORK_CONFIGS, type NetworkConfig } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAppKit, useAppKitNetwork } from "@reown/appkit/react";
import NetworkIcon from "./network-icon";

export default function NetworkSelect() {
  const selectedNetworkId = useSystemStore((s) => s.selectedNetworkId);
  const { switchNetwork } = useAppKitNetwork();
  const { open } = useAppKit();
  const selectedNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === selectedNetworkId,
  );

  const setPendingNetworkSwitch = useSystemStore(
    (s) => s.setPendingNetworkSwitch,
  );

  const handleNetworkChange = async (network: NetworkConfig) => {
    const targetNamespace = network.id === "solanaDevnet" ? "solana" : "eip155";
    const alreadyConnectedToNamespace = !!appKit.getAddress(targetNamespace);
    try {
      if (alreadyConnectedToNamespace) {
        // Already connected to the target namespace — switch directly to the exact chain.
        await switchNetwork(network.appKitNetwork);
      } else {
        // Not yet connected to the target namespace — open connect modal.
        // The root-level useAppKitEventHandler will finalise the switch on MODAL_CLOSE.
        setPendingNetworkSwitch({
          network: network.appKitNetwork,
          closeModalOnDone: false,
        });
        open({ view: "Connect", namespace: targetNamespace });
      }
    } catch {
      setPendingNetworkSwitch(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex h-auto items-center gap-2 rounded-lg bg-mb-dark-profile-btn p-2 text-foreground md:px-3 md:py-3.75 xl:gap-3 xl:pr-6"
          title={selectedNetwork?.label ?? selectedNetworkId}
        >
          <NetworkIcon networkId={selectedNetworkId} className="md:size-8.75" />
          <span className="text-base font-normal text-mb-gray-profile max-xl:sr-only">
            {selectedNetwork?.label ?? selectedNetworkId}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={8}
        className={contentClassName()}
      >
        <div className="space-y-1 rounded-sm">
          {NETWORK_CONFIGS.map((network) => {
            const isSelected = selectedNetworkId === network.id;
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkChange(network)}
                className={itemClassName({ isSelected })}
                isSelected={isSelected}
                leftSelectedPanelClassName={leftSelectedPanelClassName({
                  isSelected,
                })}
              >
                <NetworkIcon networkId={network.id} />
                <div className="flex flex-1 justify-center">
                  <span className="text-center">{network.label}</span>
                </div>
                <NetworkIcon networkId={network.id} className="opacity-0" />
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
