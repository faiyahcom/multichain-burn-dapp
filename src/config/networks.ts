// config/networks.ts

import {
  sepolia,
  mainnet,
  solanaDevnet,
  solana,
  bscTestnet,
  bsc,
  xphereTestnet as _xphereTestnet,
  xphereMainnet as _xphereMainnet,
  type AppKitNetwork,
} from "@reown/appkit/networks";

/**
 * Switch between testnet and mainnet by setting VITE_ENV=production in your .env file.
 * Defaults to development if the variable is absent.
 */
export const IS_MAINNET = import.meta.env.VITE_ENV === "production";

/**
 * The default xphereTestnet from @reown/appkit ships with `http://testnet.x-phere.com`
 * which is HTTP-only and redirects on CORS preflight → blocked by browsers.
 * Override with Ankr's public HTTPS endpoint.
 */
export const xphereTestnet = {
  ..._xphereTestnet,
  rpcUrls: {
    default: {
      http: ["https://rpc.ankr.com/xphere_testnet"],
    },
  },
} as unknown as typeof _xphereTestnet;

/**
 * Xphere mainnet RPC – override via VITE_XPHERE_MAINNET_RPC_URL if needed.
 */
const XPHERE_MAINNET_RPC =
  import.meta.env.VITE_XPHERE_MAINNET_RPC_URL ??
  "https://rpc.ankr.com/xphere_mainnet";

export const xphereMainnet = {
  ..._xphereMainnet,
  rpcUrls: {
    default: {
      http: [XPHERE_MAINNET_RPC],
    },
  },
} as unknown as typeof _xphereMainnet;

/**
 * Active xphere network (testnet or mainnet) based on VITE_ENV.
 * Used by the WagmiAdapter transport map in appkit.ts.
 */
export const activeXphereNetwork = IS_MAINNET ? xphereMainnet : xphereTestnet;
export const ACTIVE_XPHERE_RPC = IS_MAINNET
  ? XPHERE_MAINNET_RPC
  : "https://rpc.ankr.com/xphere_testnet";

// NetworkId values stay stable so all downstream switch-cases continue to work
// regardless of whether IS_MAINNET routes them to testnet or mainnet chains.
export type NetworkId = "ethereum" | "binance" | "xphere" | "solana";

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

const TESTNET_CONFIGS: readonly NetworkConfig[] = [
  {
    id: "xphere",
    label: "Xphere",
    iconBg: "bg-[#E53935]",
    appKitNetwork: xphereTestnet,
    backendChainId: String(xphereTestnet.id),
    iconSrc: "/network/xphere.png",
    color: "#ba0023",
    shortLabel: "XPT",
    scanUrl: "https://xpt.tamsa.io",
  },
  {
    id: "binance",
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
    id: "ethereum",
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
    id: "solana",
    label: "Solana",
    iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
    appKitNetwork: solanaDevnet,
    backendChainId: SOLANA_BACKEND_CHAIN_ID,
    iconSrc: "/network/solana.png",
    color: "#b07be0",
    shortLabel: "SOL",
    scanUrl: "https://explorer.solana.com?cluster=devnet",
  },
];

const MAINNET_CONFIGS: readonly NetworkConfig[] = [
  {
    id: "xphere",
    label: "Xphere",
    iconBg: "bg-[#E53935]",
    appKitNetwork: xphereMainnet,
    backendChainId: String(xphereMainnet.id),
    iconSrc: "/network/xphere.png",
    color: "#ba0023",
    shortLabel: "XP",
    scanUrl: "https://xp.tamsa.io",
  },
  {
    id: "binance",
    label: "Binance",
    iconBg: "bg-[#F3BA2F]",
    appKitNetwork: bsc,
    backendChainId: String(bsc.id),
    iconSrc: "/network/binance.png",
    color: "#f9b845",
    shortLabel: "BNB",
    scanUrl: "https://bscscan.com",
  },
  // {
  //   id: "ethereum",
  //   label: "Ethereum",
  //   iconBg: "bg-[#627EEA]",
  //   appKitNetwork: mainnet,
  //   backendChainId: String(mainnet.id),
  //   iconSrc: "/network/ethereum.png",
  //   color: "#5779FE",
  //   shortLabel: "ETH",
  //   scanUrl: "https://etherscan.io",
  // },
  // {
  //   id: "solana",
  //   label: "Solana",
  //   iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
  //   appKitNetwork: solana,
  //   backendChainId: SOLANA_BACKEND_CHAIN_ID,
  //   iconSrc: "/network/solana.png",
  //   color: "#b07be0",
  //   shortLabel: "SOL",
  //   scanUrl: "https://explorer.solana.com",
  // },
];

export const NETWORK_CONFIGS: readonly NetworkConfig[] = IS_MAINNET
  ? MAINNET_CONFIGS
  : TESTNET_CONFIGS;

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

export const evmAppkitNetworks = IS_MAINNET
  ? [mainnet, bsc, xphereMainnet]
  : [sepolia, bscTestnet, xphereTestnet];

/**
 * CORS-safe RPC overrides keyed by numeric chain ID.
 * Some network definitions in @reown/appkit ship with HTTP-only RPCs
 * that redirect on preflight and break browser-based dApps.
 */
const RPC_OVERRIDES: Record<number, string> = IS_MAINNET
  ? { [xphereMainnet.id]: XPHERE_MAINNET_RPC }
  : { [xphereTestnet.id]: "https://rpc.ankr.com/xphere_testnet" };

/**
 * Returns a CORS-safe RPC URL for the given backend chainId string.
 * Checks RPC_OVERRIDES first, then falls back to the network's default RPC.
 */
export const getRpcUrl = (chainId: string): string | undefined => {
  const numericId = Number(chainId);
  if (RPC_OVERRIDES[numericId]) return RPC_OVERRIDES[numericId];

  const cfg = chainIdToNetworkConfig(chainId);
  return (cfg?.appKitNetwork as any)?.rpcUrls?.default?.http?.[0];
};
