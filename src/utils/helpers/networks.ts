import { chainIdToNetworkConfig, IS_MAINNET, NETWORK_CONFIGS, SOLANA_BACKEND_CHAIN_ID, type NetworkId } from "@/config/networks";

export function mapChainToSystemNetwork(
    namespace: string,
    chainRef: string
): NetworkId | null {
    return NETWORK_CONFIGS.find((net) => {
        if (namespace === "eip155") {
            return net.appKitNetwork.id === Number(chainRef);
        }

        if (namespace === "solana") {
            return net.id === "solana";
        }

        return false;
    })?.id ?? null;
}

export function getExplorerTxUrl(chainId: string, hash: string): string {
    return getExplorerUrl(chainId, hash, "tx");
}

export function getExplorerUrl(chainId: string, value: string, type: "address" | "tx" = "address"): string {
    const network = chainIdToNetworkConfig(chainId);
    const baseUrl = network?.appKitNetwork.blockExplorers?.default?.url;
    if (!baseUrl || !value) return "#";
    // Solana explorer uses a different path format; devnet requires a cluster param
    if (network?.id === "solana") {
        const suffix = IS_MAINNET ? "" : "?cluster=devnet";
        return `${baseUrl.replace(/\/$/, "")}/${type}/${value}${suffix}`;
    }
    return `${baseUrl.replace(/\/$/, "")}/${type}/${value}`;
}