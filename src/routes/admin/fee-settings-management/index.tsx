import FeeSettingsManagement from '@/views/admin/fee-settings-management'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/fee-settings-management/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FeeSettingsManagement />
}
