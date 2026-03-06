import MyParticipatedBurnPools from '@/views/my-participated-pools/burn-pool';
import MyParticipatedClaimable from '@/views/my-participated-pools/claimable';
import MyParticipatedSwapPools from '@/views/my-participated-pools/swap-pool';
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
    return <MyParticipatedClaimable/>
  if(tab === "swap-pool")
    return <MyParticipatedSwapPools/>

  return <MyParticipatedBurnPools/>
}
