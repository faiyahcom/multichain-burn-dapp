import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/staking/detail/$address')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/staking/detail/$address"!</div>
}
