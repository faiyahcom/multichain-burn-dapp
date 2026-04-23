import { createFileRoute } from "@tanstack/react-router";
import EditStakePoolScreen from "@/views/admin/stake/edit/EditStakePoolScreen";

export const Route = createFileRoute("/admin/stake/edit/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address } = Route.useParams();
  return <EditStakePoolScreen poolAddress={address} />;
}
