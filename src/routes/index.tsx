import { createFileRoute } from '@tanstack/react-router'
import { ConnectWalletButtons } from '@/components/ConnectWalletButtons'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold">Wallet Connect Sandbox</h1>
      <ConnectWalletButtons />
    </div>
  )
}
