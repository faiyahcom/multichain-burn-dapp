import { useState, type ReactNode } from "react";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAuthStore } from "@/stores/authStore";
import {
  useAppKitAccount,
  useAppKit,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import { useConnections } from "wagmi";
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
 * on the pool's chain before any on-chain interaction.
 *
 * EVM connections are handled by type, because injected wallets and WalletConnect
 * behave differently:
 *
 *  - INJECTED (in-app browser / extension): the tx uses the injected provider, so
 *    we read its real chain (useInjectedEvmChainId) and switch/add the chain on
 *    that same provider (ensureEvmChain). This is the proven in-app-browser path.
 *  - WALLETCONNECT: the WC provider doesn't reliably surface eth_chainId /
 *    chainChanged to the dApp, so we read AppKit's session chain (from caipAddress)
 *    and switch via AppKit's switchNetwork (which drives the WC session).
 *
 * Cross-namespace (not connected to the pool's namespace) routes through the
 * connect+switch modal.
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
  const { address: evmAddress, caipAddress: evmCaip } = useAppKitAccount({
    namespace: "eip155",
  });
  const { address: solanaAddress } = useAppKitAccount({ namespace: "solana" });
  const { switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");
  const injectedChainId = useInjectedEvmChainId();
  const connections = useConnections();
  const [switching, setSwitching] = useState(false);

  // Is the active EVM connection a WalletConnect session (vs injected / in-app)?
  const evmConnector = connections[0]?.connector;
  const isWalletConnect =
    evmConnector?.type === "walletConnect" ||
    evmConnector?.id === "walletConnect";

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

  // EVM connected chain id, sourced per connection type:
  //  - WalletConnect → AppKit's session chain (parsed from the eip155 caipAddress).
  //  - Injected → the provider's actual eth_chainId.
  const wcEvmChainId = evmCaip ? Number(evmCaip.split(":")[1]) : null;
  const currentEvmChainId = isWalletConnect ? wcEvmChainId : injectedChainId;

  const onRightChain = isSolanaPool
    ? !!solanaAddress
    : !!evmAddress && currentEvmChainId === Number(poolNetwork.appKitNetwork.id);

  if (onRightChain) return <>{children}</>;

  // When the header already shows the pool's network (selectedNetworkId matches)
  // but the wallet isn't actually on it, the chain just needs to be ADDED — so
  // label it "Add Network" to avoid the confusing "Switch Network".
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

  // Connected to the right namespace but on the wrong EVM chain — switch per type:
  //  - WalletConnect → AppKit switchNetwork (drives the WC session).
  //  - Injected → ensureEvmChain on the actual provider (the proven in-app path:
  //    switches in-context and adds the chain config if missing).
  const handleSwitch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (switching) return;
    setSwitching(true);
    try {
      if (isWalletConnect) {
        await switchNetwork(poolNetwork.appKitNetwork);
      } else {
        await ensureEvmChain(walletProvider, poolNetwork);
      }
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
