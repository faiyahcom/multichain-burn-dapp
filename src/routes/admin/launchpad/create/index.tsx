import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/launchpad/create/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/launchpad/create/"!</div>
}
