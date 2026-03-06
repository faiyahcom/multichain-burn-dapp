import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/my-dashboard/"!</div>;
}
