import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-create-pools/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/my-create-pools/"!</div>
}
