import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/personal-info-settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/personal-info-settings/"!</div>
}
