// config/networks.ts

import {
  sepolia,
  solanaDevnet,
  bscTestnet,
  xphereTestnet,
  type AppKitNetwork,
} from "@reown/appkit/networks";

export type NetworkId =
  | "ethereumTestnet"
  | "binanceTestnet"
  | "xphereTestnet"
  | "solanaDevnet";

export const SOLANA_BACKEND_CHAIN_ID = "-1";

export type NetworkConfig = {
  id: NetworkId;
  label: string;
  iconBg: string;
  appKitNetwork: AppKitNetwork;
  /** Chain ID used by the backend API (e.g. "11155111" for Sepolia, "-1" for Solana) */
  backendChainId: string;
  iconSrc: string;
  color: string;
  shortLabel: string;
  /** Base URL for the block explorer, e.g. "https://sepolia.etherscan.io" */
  scanUrl: string;
};

export type nativeCurrency = {
  decimals: number;
  name: string;
  symbol: string;
};

export const NETWORK_CONFIGS: readonly NetworkConfig[] = [
  {
    id: "ethereumTestnet",
    label: "Ethereum",
    iconBg: "bg-[#627EEA]",
    appKitNetwork: sepolia,
    backendChainId: String(sepolia.id),
    iconSrc: "/network/ethereum.png",
    color: "#5779FE",
    shortLabel: "ETH",
    scanUrl: "https://sepolia.etherscan.io",
  },
  {
    id: "binanceTestnet",
    label: "Binance",
    iconBg: "bg-[#F3BA2F]",
    appKitNetwork: bscTestnet,
    backendChainId: String(bscTestnet.id),
    iconSrc: "/network/binance.png",
    color: "#f9b845",
    shortLabel: "BNB",
    scanUrl: "https://testnet.bscscan.com",
  },
  {
    id: "xphereTestnet",
    label: "Xphere",
    iconBg: "bg-[#E53935]",
    appKitNetwork: xphereTestnet,
    backendChainId: String(xphereTestnet.id),
    iconSrc: "/network/xphere.png",
    color: "#ba0023",
    shortLabel: "XPH",
    scanUrl: "https://explorer.xphere.io",
  },
  {
    id: "solanaDevnet",
    label: "Solana",
    iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
    appKitNetwork: solanaDevnet,
    backendChainId: SOLANA_BACKEND_CHAIN_ID,
    iconSrc: "/network/solana.png",
    color: "#b07be0",
    shortLabel: "SOL",
    scanUrl: "https://explorer.solana.com",
  },
];

export const networkIdToChainId = (networkId: string): string | undefined => {
  return NETWORK_CONFIGS.find((config) => config.id === networkId)
    ?.backendChainId;
};

export const chainIdToNetworkConfig = (
  chainId: string,
): NetworkConfig | undefined => {
  return NETWORK_CONFIGS.find((config) => config.backendChainId === chainId);
};

export const getDecimalsTokenNativeByChainId = (
  chainId: string | number,
): nativeCurrency => {
  const networkConfig = chainIdToNetworkConfig(String(chainId));
  return networkConfig?.appKitNetwork.nativeCurrency as nativeCurrency;
};

export const evmAppkitNetworks = [sepolia, bscTestnet, xphereTestnet];
