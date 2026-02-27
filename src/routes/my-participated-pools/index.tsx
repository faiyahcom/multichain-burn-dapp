import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-participated-pools/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/my-participated-pools/"!</div>
}
