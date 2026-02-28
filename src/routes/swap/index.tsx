import SwapPool from '@/views/swap-pool'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/swap/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <SwapPool />
}
