import PairDetailGlowList from "@/views/pair-detail/glow/list";
import PairDetailGlowSearch from "@/views/pair-detail/glow/search";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pair-detail/$chainId/$tokenIn/$tokenOut",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full space-y-4 xl:space-y-8">
      <PairDetailGlowSearch />
      <PairDetailGlowList />
    </div>
  );
}
