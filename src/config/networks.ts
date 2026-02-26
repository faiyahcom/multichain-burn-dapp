// config/networks.ts

import {
    sepolia,
    solanaTestnet,
    type AppKitNetwork,
} from "@reown/appkit/networks";

export type NetworkId =
    | "ethereumTestnet"
    | "binanceTestnet"
    | "xphereTestnet"
    | "solanaTestnet";

export type NetworkConfig = {
    id: NetworkId;
    label: string;
    iconBg: string;
    appKitNetwork: AppKitNetwork;
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
        label: "Ethereum Testnet",
        iconBg: "bg-[#627EEA]",
        appKitNetwork: sepolia,
    },
    {
        id: "binanceTestnet",
        label: "Binance Testnet",
        iconBg: "bg-[#F3BA2F]",
        appKitNetwork: bscTestnet,
    },
    {
        id: "xphereTestnet",
        label: "Xphere Testnet",
        iconBg: "bg-[#E53935]",
        appKitNetwork: xphereTestnet,
    },
    {
        id: "solanaTestnet",
        label: "Solana Testnet",
        iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
        appKitNetwork: solanaTestnet,
    },
];