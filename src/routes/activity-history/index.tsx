import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/activity-history/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/activity-history/"!</div>
}
