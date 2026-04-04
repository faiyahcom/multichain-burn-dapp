import type { ReactNode } from "react";
import { chainIdToNetworkConfig } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAuthStore } from "@/stores/authStore";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/common/glow/button";
import { cn } from "@/lib/utils";

type PoolChainGuardVariant = "pair" | "burn" | "swap";

type Props = {
  /** Backend chainId of the pool (e.g. "11155111"). */
  chainId?: string;
  children: ReactNode;
  variant?: PoolChainGuardVariant;
  className?: string;
};

/**
 * Wraps on-chain action buttons for a specific pool.
 *
 * - Wallet not connected  → renders "Connect Wallet" button.
 * - Wrong network          → renders "Switch Network" button that opens the
 *                            global SwitchNetworkModal via openSwitchNetworkModal.
 * - Correct network        → renders children as-is.
 */
export function PoolChainGuard({ chainId, children, variant = "pair", className }: Props) {
  const { user } = useAuthStore();
  const { open } = useAppKit();
  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();

  const poolNetwork = chainId ? chainIdToNetworkConfig(chainId) : undefined;
  const poolNetworkId = poolNetwork?.id;

  const btnClassName = cn(
    "my-2 w-full py-2 font-orbitron text-base md:my-3.25 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl",
    className,
  );

  // Wallet not connected.
  if (!user) {
    return (
      <Button
        variant={variant}
        hasHover
        className={btnClassName}
        onClick={() => open()}
      >
        Connect Wallet
      </Button>
    );
  }

  // Derive the wallet's currently connected network from caipAddress.
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const currentNetworkId =
    namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

  // Wrong network — show button that opens the global switch modal.
  if (currentNetworkId !== poolNetworkId) {
    return (
      <Button
        variant={variant}
        hasHover
        className={btnClassName}
        onClick={() => openSwitchNetworkModal(currentNetworkId, poolNetworkId!)}
      >
        Switch Network
      </Button>
    );
  }

  return <>{children}</>;
}
