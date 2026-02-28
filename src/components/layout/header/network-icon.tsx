import { NETWORK_CONFIGS, type NetworkConfig } from "@/config/networks";
import { cn } from "@/lib/utils";

function NetworkIcon({
  networkId,
  className,
}: {
  networkId: NetworkConfig["id"];
  className?: string;
}) {
  const net = NETWORK_CONFIGS.find((n) => n.id === networkId);
  if (!net) return null;
  return (
    <span
      className={cn(
        "inline-block h-6 w-6 shrink-0 rounded",
        net.iconBg,
        className,
      )}
      aria-hidden
    />
  );
}

export default NetworkIcon;
