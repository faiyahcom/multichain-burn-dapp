import SwapPoolDetail from "@/views/swap-pool/detail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/swap/detail/$address")({
  component: SwapDetailComponent,
});

function SwapDetailComponent() {
  const { address } = Route.useParams();

  return <SwapPoolDetail address={address} />;
}
