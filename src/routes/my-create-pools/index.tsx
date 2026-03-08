import UserBurnPools from '@/views/user-pools/burn-pool';
import UserSwapPools from '@/views/user-pools/swap-pool';
import { createFileRoute } from '@tanstack/react-router'

type Tab = 'burn-pool' | 'swap-pool';

export const Route = createFileRoute('/my-create-pools/')({
  validateSearch: (search: Record<string, Tab>) => ({
    tab: search.tab ?? 'burn-pool',
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { tab } = Route.useSearch() as { tab: Tab }

  if (tab === 'swap-pool')
    return <UserSwapPools mode="owner" title="My Created Pools" />

  return <UserBurnPools mode="owner" title="My Created Pools" />
}
