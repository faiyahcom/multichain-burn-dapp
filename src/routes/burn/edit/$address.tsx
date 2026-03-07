import { createFileRoute } from "@tanstack/react-router";
import EditPoolScreen from "@/views/burn-pool/detail/EditPoolScreen";

export const Route = createFileRoute("/burn/edit/$address")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address } = Route.useParams();
  return <EditPoolScreen poolAddress={address} />;
}
