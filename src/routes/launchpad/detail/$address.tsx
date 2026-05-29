import { createFileRoute } from "@tanstack/react-router";
import LaunchpadPoolDetail from "@/views/launchpad/detail";

export const Route = createFileRoute("/launchpad/detail/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address } = Route.useParams();
  return <LaunchpadPoolDetail address={address} />;
}
