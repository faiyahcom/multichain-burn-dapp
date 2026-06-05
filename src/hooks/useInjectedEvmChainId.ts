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
 * Authoritative for the INJECTED / in-app-browser path: reads `eth_chainId`
 * directly and updates on the provider's `chainChanged` event. (The WalletConnect
 * path uses AppKit's session chain instead — see PoolChainGuard.)
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
