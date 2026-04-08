import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { type AppKitNetwork } from "@reown/appkit/networks";
import { APPKIT_PROJECT_ID } from "@/config/constant";
import { NETWORK_CONFIGS, type NetworkConfig } from "./networks";
import { http } from "viem";
import { xphereTestnet } from "@reown/appkit/networks";

if (!APPKIT_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Reown AppKit] Missing VITE_REOWN_PROJECT_ID. Please set it in your .env file.",
  );
}

export const networks = NETWORK_CONFIGS.map(
  (n: NetworkConfig) => n.appKitNetwork,
) as [AppKitNetwork, ...AppKitNetwork[]];

const metadata = {
  name: "Multichain Burn dApp",
  description: "Multichain burn dApp using Reown AppKit (EVM + Solana)",
  url: window.location.origin,
  icons: [`${window.location.origin}/vite.svg`],
};

export const wagmiAdapter = new WagmiAdapter({
  projectId: APPKIT_PROJECT_ID ?? "",
  networks,
  ssr: false,
  transports: {
    [xphereTestnet.id]: http("https://rpc.ankr.com/xphere_testnet"),
  },
});

export const solanaAdapter = new SolanaAdapter();

export const appKitConfig = {
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  metadata,
  projectId: APPKIT_PROJECT_ID ?? "",
  features: {
    analytics: true,
  },
};
