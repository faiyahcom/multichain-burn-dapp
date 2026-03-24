import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appKit } from "@/config/appkit";
import { NETWORK_CONFIGS, type NetworkConfig } from "@/config/networks";
import { cn } from "@/lib/utils";
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
          className="flex items-center gap-2 rounded-lg text-sm font-medium text-foreground max-md:p-0"
          title={selectedNetwork?.label ?? selectedNetworkId}
        >
          <NetworkIcon networkId={selectedNetworkId} />
          <span className="max-md:sr-only">
            {selectedNetwork?.label ?? selectedNetworkId}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={8}
        className="min-w-56 rounded-lg border-transparent"
      >
        <div className="space-y-1 rounded-sm">
          {NETWORK_CONFIGS.map((network) => {
            const isSelected = selectedNetworkId === network.id;
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkChange(network)}
                className={cn(
                  "flex items-center gap-3 rounded-5px px-4 py-2",
                  "transition-colors",
                  "hover:bg-mb-btn-swap/50",
                  { "bg-mb-btn-swap/50": isSelected },
                )}
                isSelected={isSelected}
                leftSelectedPanelClassName={cn("group-hover:bg-mb-btn-swap", {
                  "bg-mb-btn-swap": isSelected,
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
