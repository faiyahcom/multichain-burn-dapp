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

export type NetworkConfig = {
  id: NetworkId;
  label: string;
  iconBg: string;
  appKitNetwork: AppKitNetwork;
  iconSrc: string;
  color: string;
  shortLabel: string;
};

/**
 * Custom EVM Networks
 */

// 🔵 Binance Testnet (BSC Testnet)
export const bscTestnet: AppKitNetwork = {
  id: 97,
  name: "BSC Testnet",
  network: "bsc-testnet",
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
  network: "xphere-testnet",
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
    iconSrc: "/network/ethereum.png",
    color: "#5779FE",
    shortLabel: "ETH",
  },
  {
    id: "binanceTestnet",
    label: "Binance",
    iconBg: "bg-[#F3BA2F]",
    appKitNetwork: bscTestnet,
    iconSrc: "/network/binance.png",
    color: "#f9b845",
    shortLabel: "BNB",
  },
  {
    id: "xphereTestnet",
    label: "Xphere",
    iconBg: "bg-[#E53935]",
    appKitNetwork: xphereTestnet,
    iconSrc: "/network/xphere.png",
    color: "#ba0023",
    shortLabel: "XPH",
  },
  {
    id: "solanaDevnet",
    label: "Solana",
    iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
    appKitNetwork: solanaDevnet,
    iconSrc: "/network/solana.png",
    color: "#b07be0",
    shortLabel: "SOL",
  },
];

export const networkIdToChainId = (networkId: string): string | undefined => {
  if (networkId === "solanaDevnet") {
    return "-1";
  } else {
    return NETWORK_CONFIGS.find(
      (config) => config.id === networkId,
    )?.appKitNetwork.id.toString();
  }
};

export const chainIdToNetworkConfig = (
  chainId: string,
): NetworkConfig | undefined => {
  if (chainId === "-1") {
    return NETWORK_CONFIGS.find((config) => config.id === "solanaDevnet");
  }
  return NETWORK_CONFIGS.find(
    (config) => config.appKitNetwork.id.toString() === chainId,
  );
};

export const evmAppkitNetworks = [sepolia, bscTestnet, xphereTestnet];
