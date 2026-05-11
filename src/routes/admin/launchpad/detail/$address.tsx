import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/launchpad/detail/$address')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/launchpad/detail/$address"!</div>
}
