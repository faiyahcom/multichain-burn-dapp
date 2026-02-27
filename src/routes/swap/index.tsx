import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/swap/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/swap/"!</div>
}
