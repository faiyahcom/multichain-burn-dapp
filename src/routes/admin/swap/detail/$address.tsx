import AdminSwapPoolDetail from '@/views/admin/swap/detail';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/swap/detail/$address')({
  component: RouteComponent,
})

function RouteComponent() {
  const { address } = Route.useParams();
  return <AdminSwapPoolDetail address={address} />
}
