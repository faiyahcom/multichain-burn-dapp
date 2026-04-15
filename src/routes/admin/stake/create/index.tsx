import CreateStakePool from "@/views/admin/stake/create";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stake/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CreateStakePool />;
}
