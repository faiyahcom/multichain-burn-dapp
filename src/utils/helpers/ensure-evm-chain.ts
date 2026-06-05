import { getRpcUrl, type NetworkConfig } from "@/config/networks";

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const toHexChainId = (id: number) => `0x${id.toString(16)}`;

/**
 * Ensure the INJECTED EVM wallet provider is on `network` — adding the chain
 * config to the wallet first if it doesn't have it yet.
 *
 * Why query the provider directly (not wagmi's useChainId): the dApp's EVM
 * actions send transactions through `useAppKitProvider("eip155").walletProvider`
 * (ethers.BrowserProvider). That provider's `eth_chainId` is the chain the tx
 * will ACTUALLY use, and it can differ from wagmi/AppKit's cached chain in
 * multichain setups. So this is the authoritative "are we on the right chain"
 * check, meant to run right before an on-chain action.
 *
 * Timing note: call this at action/click time (post-connect). Firing a custom-
 * chain add during the connect handshake crashes MetaMask mobile; doing it later
 * (like a manual switch) is the path that works.
 */
export async function ensureEvmChain(
  walletProvider: unknown,
  network: NetworkConfig,
): Promise<void> {
  const provider = walletProvider as Eip1193 | undefined;
  if (!provider?.request) throw new Error("Wallet provider unavailable");

  const target = network.appKitNetwork;
  const targetId = Number(target.id);
  const targetHex = toHexChainId(targetId);

  const currentHex = (await provider.request({
    method: "eth_chainId",
  })) as string;
  if (parseInt(currentHex, 16) === targetId) return; // already on the right chain

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetHex }],
    });
  } catch (err) {
    const e = err as { code?: number; message?: string };
    // 4902 = the chain isn't added to the wallet yet → add it (also switches).
    const notAdded =
      e?.code === 4902 || /Unrecognized chain|not.*added/i.test(e?.message ?? "");
    if (!notAdded) throw err;

    const rpcUrl =
      getRpcUrl(network.backendChainId) ?? target.rpcUrls?.default?.http?.[0];
    const explorerUrl = target.blockExplorers?.default?.url;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: targetHex,
          chainName: target.name,
          nativeCurrency: target.nativeCurrency,
          rpcUrls: rpcUrl ? [rpcUrl] : [],
          ...(explorerUrl ? { blockExplorerUrls: [explorerUrl] } : {}),
        },
      ],
    });
  }

  // Verify the wallet actually landed on the target chain before proceeding.
  // const afterHex = (await provider.request({
  //   method: "eth_chainId",
  // })) as string;
  // if (parseInt(afterHex, 16) !== targetId) {
  //   throw new Error(`Please switch your wallet to ${network.label} and try again.`);
  // }
}
