import type { ReactNode } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAuthStore } from "@/stores/authStore";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useChainId } from "wagmi";
import { Button } from "@/components/common/glow/button";
import { cn } from "@/lib/utils";

type PoolChainGuardVariant = "pair" | "burn" | "swap" | "stake";

type Props = {
  /** Backend chainId of the pool (e.g. "11155111"). */
  chainId?: string;
  children: ReactNode;
  variant?: PoolChainGuardVariant;
  className?: string;
};

/**
 * Wraps on-chain action buttons for a specific pool and guarantees the wallet is
 * on the pool's chain before any on-chain interaction can be triggered.
 *
 * - Wallet not connected  → "Connect Wallet" button.
 * - Wrong network          → "Switch Network" button (opens the global
 *                            SwitchNetworkModal → switchNetwork).
 * - Correct network        → renders children (the action) as-is.
 *
 * The connected-network check uses wagmi's `useChainId()` for EVM — the chain a
 * transaction will actually be sent on — rather than a parsed `caipAddress`,
 * which can lag the wallet. `useChainId()` updates on the wallet's `chainChanged`
 * event, so the action button is gated on the wallet's *current* chain at all
 * times: it is never rendered (and therefore never clickable) on the wrong chain.
 */
export function PoolChainGuard({
  chainId,
  children,
  variant = "pair",
  className,
}: Props) {
  const { user } = useAuthStore();
  const { open } = useAppKit();
  const { openSwitchNetworkModal } = useSystemStore();

  const { address: evmAddress } = useAppKitAccount({ namespace: "eip155" });
  const { address: solanaAddress } = useAppKitAccount({ namespace: "solana" });
  const evmChainId = useChainId();

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
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
      >
        Connect Wallet
      </Button>
    );
  }

  // No specific chain requirement — render the action as-is.
  if (!poolNetworkId) return <>{children}</>;

  // Authoritative "what chain is the wallet actually on" for the pool's namespace.
  // EVM: wagmi's live chainId (the chain a tx will use). Solana: connected account.
  const currentNetworkId: NetworkId | null =
    poolNetworkId === "solana"
      ? solanaAddress
        ? "solana"
        : null
      : evmAddress
        ? mapChainToSystemNetwork("eip155", String(evmChainId))
        : null;

  // Wrong network — block the action and offer a switch instead.
  if (currentNetworkId !== poolNetworkId) {
    return (
      <Button
        variant={variant}
        hasHover
        className={btnClassName}
        onClick={(e) => {
          e.stopPropagation();
          openSwitchNetworkModal(currentNetworkId, poolNetworkId);
        }}
      >
        Switch Network
      </Button>
    );
  }

  return <>{children}</>;
}
