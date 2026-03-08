import CreateBurnPool from "@/views/burn-pool/create";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/burn/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CreateBurnPool />;
}
