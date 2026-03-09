import CreateSwapPool from "@/views/swap-pool/create";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/create/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CreateSwapPool />;
}
