import { AppKitProvider } from '@reown/appkit/react'
import { type PropsWithChildren } from 'react'
import { WagmiProvider } from 'wagmi'
import { appKitConfig, wagmiAdapter } from '@/config/appkit'

export function AppkitProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <AppKitProvider {...appKitConfig}>{children}</AppKitProvider>
    </WagmiProvider>
  )
}
