import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/launchpad/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/launchpad/"!</div>
}
