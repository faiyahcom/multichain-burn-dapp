import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/launchpad/detail/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/launchpad/detail/$address"!</div>;
}
