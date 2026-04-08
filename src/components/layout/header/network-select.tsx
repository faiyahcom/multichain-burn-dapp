import { ArrowIcon } from "@/components/common/arrow-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NETWORK_CONFIGS, type NetworkConfig } from "@/config/networks";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/stores/systemStore";
import NetworkIcon from "./network-icon";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";

export default function NetworkSelect() {
  const selectedNetworkId = useSystemStore((s) => s.selectedNetworkId);
  const { switchNetwork } = useAppKitNetwork();
  const { open } = useAppKit();
  const { address: evmAddress } = useAppKitAccount({ namespace: "eip155" });
  const { address: solanaAddress } = useAppKitAccount({ namespace: "solana" });
  const selectedNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === selectedNetworkId,
  );

  const setPendingNetworkSwitch = useSystemStore(
    (s) => s.setPendingNetworkSwitch,
  );

  const handleNetworkChange = async (network: NetworkConfig) => {
    const targetNamespace = network.id === "solanaDevnet" ? "solana" : "eip155";
    const alreadyConnectedToNamespace = targetNamespace === "solana" ? !!solanaAddress : !!evmAddress;
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
          className="flex items-center gap-2 rounded-lg border-progress-bg/40 bg-sub-bg text-sm font-medium text-foreground hover:bg-inactive/40"
        >
          <NetworkIcon networkId={selectedNetworkId} />
          <span className="max-sm:hidden">
            {selectedNetwork?.label ?? selectedNetworkId}
          </span>
          <ArrowIcon direction="down" className="text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        alignOffset={8}
        className="min-w-56 rounded-lg"
      >
        <div className="space-y-4 rounded-sm bg-primary-foreground px-1 py-4">
          {NETWORK_CONFIGS.map((network) => {
            const isSelected = selectedNetworkId === network.id;
            return (
              <DropdownMenuItem
                key={network.id}
                onClick={() => handleNetworkChange(network)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2",
                  isSelected && "bg-inactive font-bold text-active",
                )}
                isSelected={isSelected}
              >
                <NetworkIcon networkId={network.id} />
                <div className="flex flex-1 justify-center">
                  <span className="text-center group-hover:font-bold group-hover:text-active">
                    {network.label}
                  </span>
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
