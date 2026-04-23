import { StakePoolList } from "@/views/pool/glow/pool";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/staking/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <StakePoolList />;
}
