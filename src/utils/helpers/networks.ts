import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";

export function mapChainToSystemNetwork(
  namespace: string,
  chainRef: string,
): NetworkId | null {
  return (
    NETWORK_CONFIGS.find((net) => {
      if (namespace === "eip155") {
        return net.appKitNetwork.id === Number(chainRef);
      }

      if (namespace === "solana") {
        return net.id === "solanaDevnet";
      }

      return false;
    })?.id ?? null
  );
}
