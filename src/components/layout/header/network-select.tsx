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
import { useAppKitNetwork } from "@reown/appkit/react";

export default function NetworkSelect() {
  const selectedNetworkId = useSystemStore((s) => s.selectedNetworkId);
  const setSelectedNetworkId = useSystemStore((s) => s.setSelectedNetworkId);
  const { switchNetwork } = useAppKitNetwork();
  const selectedNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === selectedNetworkId,
  );

  const handleNetworkChange = async (network: NetworkConfig) => {
    try {
      await switchNetwork(network.appKitNetwork);
      setSelectedNetworkId(network.id);
    } catch {
      // User rejected the switch — keep the current network selected.
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
          <span>{selectedNetwork?.label ?? selectedNetworkId}</span>
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
