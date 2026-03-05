// config/networks.ts

import {
  sepolia,
  solanaDevnet,
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
  customNetworkId?: string;
};

/**
 * Custom EVM Networks
 */

// 🔵 Binance Testnet (BSC Testnet)
export const bscTestnet: AppKitNetwork = {
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "BscScan",
      url: "https://testnet.bscscan.com",
    },
  },
};

// 🔴 Xphere Testnet (⚠️ replace with real RPC)
export const xphereTestnet: AppKitNetwork = {
  id: 12345, // 🔥 replace with real chainId
  name: "Xphere Testnet",
  nativeCurrency: {
    name: "XPH",
    symbol: "XPH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.xphere.network"], // 🔥 replace if needed
    },
  },
  blockExplorers: {
    default: {
      name: "Xphere Explorer",
      url: "https://explorer-testnet.xphere.network",
    },
  },
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
    customNetworkId: sepolia.id.toString(),
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
    customNetworkId: bscTestnet.id.toString(),
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
    customNetworkId: xphereTestnet.id.toString(),
  },
  {
    id: "solanaDevnet",
    label: "Solana",
    iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
    appKitNetwork: solanaDevnet,
<<<<<<< Updated upstream
    backendChainId: SOLANA_BACKEND_CHAIN_ID,
=======
>>>>>>> Stashed changes
    iconSrc: "/network/solana.png",
    color: "#b07be0",
    shortLabel: "SOL",
    customNetworkId: "-1",
  },
];

export const networkIdToChainId = (networkId: string): string | undefined => {
  return NETWORK_CONFIGS.find(
    (config) => config.id === networkId,
  )?.backendChainId;
};

export const chainIdToNetworkConfig = (
  chainId: string,
): NetworkConfig | undefined => {
  return NETWORK_CONFIGS.find(
    (config) => config.backendChainId === chainId,
  );
};

export const evmAppkitNetworks = [sepolia, bscTestnet, xphereTestnet];
