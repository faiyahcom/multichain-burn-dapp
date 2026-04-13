// config/networks.ts

import {
  sepolia,
  solanaDevnet,
  bscTestnet,
  xphereTestnet as _xphereTestnet,
  type AppKitNetwork,
} from "@reown/appkit/networks";

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
    id: "xphereTestnet",
    label: "Xphere",
    iconBg: "bg-[#E53935]",
    appKitNetwork: xphereTestnet,
    backendChainId: String(xphereTestnet.id),
    iconSrc: "/network/xphere.png",
    color: "#ba0023",
    shortLabel: "XPT",
    scanUrl: "https://xpt.tamsa.io",
  },
  // {
  //   id: "ethereumTestnet",
  //   label: "Ethereum",
  //   iconBg: "bg-[#627EEA]",
  //   appKitNetwork: sepolia,
  //   backendChainId: String(sepolia.id),
  //   iconSrc: "/network/ethereum.png",
  //   color: "#5779FE",
  //   shortLabel: "ETH",
  //   scanUrl: "https://sepolia.etherscan.io",
  // },
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
  // {
  //   id: "solanaDevnet",
  //   label: "Solana",
  //   iconBg: "bg-gradient-to-br from-[#00FFA3] to-[#9945FF]",
  //   appKitNetwork: solanaDevnet,
  //   backendChainId: SOLANA_BACKEND_CHAIN_ID,
  //   iconSrc: "/network/solana.png",
  //   color: "#b07be0",
  //   shortLabel: "SOL",
  //   scanUrl: "https://explorer.solana.com",
  // },
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

/**
 * CORS-safe RPC overrides keyed by numeric chain ID.
 * Some network definitions in @reown/appkit ship with HTTP-only RPCs
 * that redirect on preflight and break browser-based dApps.
 */
const RPC_OVERRIDES: Record<number, string> = {
  [xphereTestnet.id]: "https://rpc.ankr.com/xphere_testnet",
};

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
