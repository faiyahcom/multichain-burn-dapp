import { useState, type ReactNode } from "react";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAuthStore } from "@/stores/authStore";
import {
  useAppKitAccount,
  useAppKit,
  useAppKitProvider,
} from "@reown/appkit/react";
import { useInjectedEvmChainId } from "@/hooks/useInjectedEvmChainId";
import { ensureEvmChain } from "@/utils/helpers/ensure-evm-chain";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toast } from "@/components/common/custom-toast";
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
 * actually on the pool's chain before any on-chain interaction.
 *
 * The EVM "are we on the right chain" check reads the INJECTED provider's real
 * chain (useInjectedEvmChainId) — the chain the transaction will use — not
 * wagmi's cached chain, which can disagree. When connected to the right namespace
 * but on the wrong EVM chain, the button calls ensureEvmChain() against that same
 * provider: it switches, and adds the chain config to the wallet if missing.
 * Cross-namespace (not connected to the pool's namespace at all) still routes
 * through the connect+switch modal.
 */
export function PoolChainGuard({
  chainId,
  children,
  variant = "pair",
  className,
}: Props) {
  const { user } = useAuthStore();
  const { open } = useAppKit();
  const { openSwitchNetworkModal, selectedNetworkId } = useSystemStore();
  const { address: evmAddress } = useAppKitAccount({ namespace: "eip155" });
  const { address: solanaAddress } = useAppKitAccount({ namespace: "solana" });
  const { walletProvider } = useAppKitProvider("eip155");
  const injectedChainId = useInjectedEvmChainId();
  const [switching, setSwitching] = useState(false);

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
        type="button"
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
  if (!poolNetwork || !poolNetworkId) return <>{children}</>;

  const isSolanaPool = poolNetworkId === "solana";
  const connectedToNamespace = isSolanaPool ? !!solanaAddress : !!evmAddress;

  // On the correct chain? EVM compares the injected provider's actual chain id.
  const onRightChain = isSolanaPool
    ? !!solanaAddress
    : !!evmAddress && injectedChainId === Number(poolNetwork.appKitNetwork.id);

  if (onRightChain) return <>{children}</>;

  // When the header already shows the pool's network (selectedNetworkId matches)
  // but the wallet isn't actually on it, the chain just needs to be ADDED to the
  // wallet — so label it "Add Network" to avoid the confusing "Switch Network"
  // (the user thinks they're already on it, per the header).
  const needsAddLabel = selectedNetworkId === poolNetworkId;

  // Not connected to the pool's namespace → connect + switch via the modal flow.
  if (!connectedToNamespace) {
    return (
      <Button
        type="button"
        variant={variant}
        hasHover
        className={btnClassName}
        onClick={(e) => {
          e.stopPropagation();
          openSwitchNetworkModal(null, poolNetworkId);
        }}
      >
        {needsAddLabel ? "Add Network" : "Switch Network"}
      </Button>
    );
  }

  // Connected to the right namespace but on the wrong EVM chain → switch/add the
  // chain on the SAME injected provider the transaction will use.
  const handleSwitch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (switching) return;
    setSwitching(true);
    try {
      await ensureEvmChain(walletProvider, poolNetwork);
    } catch (err) {
      toast.error(
        getErrorMessage({
          error: err,
          fallbackMsg: `Failed to switch to ${poolNetwork.label}.`,
        }),
      );
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      hasHover
      disabled={switching}
      className={btnClassName}
      onClick={handleSwitch}
    >
      {switching
        ? needsAddLabel
          ? "Adding…"
          : "Switching…"
        : needsAddLabel
          ? "Add Network"
          : "Switch Network"}
    </Button>
  );
}
