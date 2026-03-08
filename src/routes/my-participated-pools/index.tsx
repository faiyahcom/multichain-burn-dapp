import UserBurnPools from '@/views/user-pools/burn-pool';
import UserClaimablePool from '@/views/user-pools/claimable';
import UserSwapPools from '@/views/user-pools/swap-pool';
import { createFileRoute } from '@tanstack/react-router'

type Tab = 'burn-pool' | 'swap-pool' | 'claimable';

export const Route = createFileRoute('/my-participated-pools/')({
  validateSearch: (search: Record<string, Tab>) => ({
    tab: search.tab ?? 'burn-pool',
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { tab } = Route.useSearch()  as {tab:Tab}

  if(tab === "claimable")
    return <UserClaimablePool/>
  if(tab === "swap-pool")
    return <UserSwapPools mode="participated"/>

  return <UserBurnPools mode="participated"/>
}
