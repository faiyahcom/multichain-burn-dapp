import { SwapPoolList } from "@/views/pool/glow/pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SwapPoolList />;
}
