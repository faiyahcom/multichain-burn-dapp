import AdminBurnPoolDetail from '@/views/admin/burn/detail';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/burn/detail/$address')({
  component: RouteComponent,
})

function RouteComponent() {
  const { address } = Route.useParams();
  return <AdminBurnPoolDetail address={address} />
}
