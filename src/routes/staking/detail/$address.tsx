import { createFileRoute } from '@tanstack/react-router'
import StakePoolDetail from '@/views/stake-pool/detail'

export const Route = createFileRoute('/staking/detail/$address')({
  component: RouteComponent,
})

function RouteComponent() {
  const { address } = Route.useParams()
  return <StakePoolDetail address={address} />
}
