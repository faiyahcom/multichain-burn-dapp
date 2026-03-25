import AdminRevenueFeeStats from '@/views/admin/revenue-fee-stats'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/revenue-fee-stats/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AdminRevenueFeeStats />
}
