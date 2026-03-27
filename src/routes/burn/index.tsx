import { createFileRoute } from "@tanstack/react-router";
import { BurnPoolList } from "@/views/pool/glow/pool";

export const Route = createFileRoute("/burn/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BurnPoolList />;
}
