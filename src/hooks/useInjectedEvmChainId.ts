import { useEffect, useState } from "react";
import { useAppKitProvider } from "@reown/appkit/react";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

/**
 * The EVM chain id the INJECTED wallet provider is actually on — i.e. the chain a
 * transaction sent via `ethers.BrowserProvider(walletProvider)` will use.
 *
 * This is the authoritative source for gating on-chain actions: in multichain
 * AppKit setups it can differ from wagmi's `useChainId()` / a parsed caipAddress.
 * Reads `eth_chainId` once and updates on the provider's `chainChanged` event.
 * Returns null when no EVM provider is available.
 */
export function useInjectedEvmChainId(): number | null {
  const { walletProvider } = useAppKitProvider("eip155");
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const provider = walletProvider as Eip1193 | undefined;
    let active = true;
    const apply = (v: number | null) => {
      if (active) setChainId(v);
    };

    if (!provider?.request) {
      // Defer so we don't call setState synchronously inside the effect body.
      queueMicrotask(() => apply(null));
      return () => {
        active = false;
      };
    }

    provider
      .request({ method: "eth_chainId" })
      .then((hex) => apply(typeof hex === "string" ? parseInt(hex, 16) : null))
      .catch(() => apply(null));

    const onChainChanged = (hex: unknown) => {
      const v = typeof hex === "string" ? parseInt(hex, 16) : Number(hex);
      apply(Number.isNaN(v) ? null : v);
    };
    provider.on?.("chainChanged", onChainChanged);

    return () => {
      active = false;
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [walletProvider]);

  return chainId;
}
