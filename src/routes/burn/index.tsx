import BurnPool from "@/views/burn-pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/burn/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BurnPool />;
}
