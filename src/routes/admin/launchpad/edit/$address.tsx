import { createFileRoute } from "@tanstack/react-router";
import EditLaunchpadPoolScreen from "@/views/admin/launchpad/edit/EditLaunchpadPoolScreen";

export const Route = createFileRoute("/admin/launchpad/edit/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address } = Route.useParams();
  return <EditLaunchpadPoolScreen poolAddress={address} />;
}
