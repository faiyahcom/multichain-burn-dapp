import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pair-list/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/pair-list/"!</div>
}
