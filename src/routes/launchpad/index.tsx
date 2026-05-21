import { LaunchpadPoolList } from "@/views/pool/glow/pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/launchpad/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <LaunchpadPoolList />;
}
