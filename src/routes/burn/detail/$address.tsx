import BurnPoolDetail from '@/views/burn-pool/detail'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/burn/detail/$address')({
  validateSearch: (search: Record<string, unknown>) => ({
    depositReward: search.depositReward === true || search.depositReward === 'true' ? true : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { address } = Route.useParams();
  return <BurnPoolDetail address={address} />
}
