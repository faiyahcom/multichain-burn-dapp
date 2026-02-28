import { ArrowIcon } from "@/components/common/arrow-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NETWORK_CONFIGS } from "@/config/networks";
import { cn } from "@/lib/utils";
import { useSystemStore } from "@/stores/systemStore";
import NetworkIcon from "./network-icon";

export default function NetworkSelect() {
  const selectedNetworkId = useSystemStore((s) => s.selectedNetworkId);
  const setSelectedNetworkId = useSystemStore((s) => s.setSelectedNetworkId);

  const selectedNetwork = NETWORK_CONFIGS.find(
    (n) => n.id === selectedNetworkId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-lg border-progress-bg/40 bg-sub-bg text-sm font-medium text-foreground hover:bg-inactive/40"
        >
          <NetworkIcon networkId={selectedNetworkId} />
          <span>{selectedNetwork?.label ?? selectedNetworkId}</span>
          <ArrowIcon direction="down" className="text-secondary-text" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 rounded-lg p-1">
        {NETWORK_CONFIGS.map((network) => {
          const isSelected = selectedNetworkId === network.id;
          return (
            <DropdownMenuItem
              key={network.id}
              onClick={() => setSelectedNetworkId(network.id)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2",
                isSelected &&
                  "border-l-4 border-active bg-active/10 font-medium text-active",
              )}
            >
              <NetworkIcon networkId={network.id} />
              <span>{network.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
