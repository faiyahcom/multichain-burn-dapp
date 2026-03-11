import { createFileRoute } from "@tanstack/react-router";
import EditPoolScreen from "@/views/admin/burn/detail/amount-activities/EditPoolScreen";

export const Route = createFileRoute("/admin/burn/edit/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address } = Route.useParams();
  return <EditPoolScreen poolAddress={address} />;
}
