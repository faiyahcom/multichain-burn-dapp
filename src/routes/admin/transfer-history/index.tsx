import AdminTransferHistory from "@/views/admin/transfer-history/statistic";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/transfer-history/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminTransferHistory />;
}
