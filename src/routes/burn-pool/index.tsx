import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/burn-pool/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/burn-pool/"!</div>
}
