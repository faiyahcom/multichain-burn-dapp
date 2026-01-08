import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from '@reown/appkit-adapter-solana'
import {
  arbitrum,
  mainnet,
  sepolia,
  solana,
  solanaDevnet,
  solanaTestnet,
  type AppKitNetwork,
} from '@reown/appkit/networks'
import { APPKIT_PROJECT_ID } from '@/config/constant'

if (!APPKIT_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Reown AppKit] Missing VITE_REOWN_PROJECT_ID. Please set it in your .env file.',
  )
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  arbitrum,
  sepolia,
  solana,
  solanaTestnet,
  solanaDevnet,
]

const metadata = {
  name: 'Multichain Burn dApp',
  description: 'Multichain burn dApp using Reown AppKit (EVM + Solana)',
  url: window.location.origin,
  icons: [`${window.location.origin}/vite.svg`],
}

export const wagmiAdapter = new WagmiAdapter({
  projectId: APPKIT_PROJECT_ID ?? '',
  networks,
  ssr: false,
})

export const solanaAdapter = new SolanaAdapter()

export const appKitConfig = {
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  metadata,
  projectId: APPKIT_PROJECT_ID ?? '',
  features: {
    analytics: true,
  },
}

export const appKit = createAppKit(appKitConfig)


