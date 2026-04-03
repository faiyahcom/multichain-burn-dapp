import { chainIdToNetworkConfig, NETWORK_CONFIGS, type NetworkId } from "@/config/networks";

export function mapChainToSystemNetwork(
    namespace: string,
    chainRef: string
): NetworkId | null {
    return NETWORK_CONFIGS.find((net) => {
        if (namespace === "eip155") {
            return net.appKitNetwork.id === Number(chainRef);
        }

        if (namespace === "solana") {
            return net.id === "solanaDevnet";
        }

        return false;
    })?.id ?? null;
}

export function getExplorerTxUrl(chainId: string, hash: string): string {
    const network = chainIdToNetworkConfig(chainId);
    const baseUrl = network?.appKitNetwork.blockExplorers?.default?.url;
    if (!baseUrl) return "#";
    // Solana explorer uses different path format
    if (network?.id === "solanaDevnet") {
        return `${baseUrl.replace(/\/$/, "")}/tx/${hash}?cluster=devnet`;
    }
    return `${baseUrl.replace(/\/$/, "")}/tx/${hash}`;
}