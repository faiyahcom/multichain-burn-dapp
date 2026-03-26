import PairDetailDetail from "@/views/pair-detail/detail";
import PairDetailGlowSearch from "@/views/pair-detail/glow/search";
import PairDetailStatistics from "@/views/pair-detail/statistic";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pair-detail/$chainId/$tokenIn/$tokenOut",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    // <div className="flex gap-4.25 pt-9.5 pr-4.25 pb-10 pl-6.75">
    //   <PairDetailDetail />
    //   <PairDetailStatistics />
    // </div>
    <div className="w-full space-y-4 xl:space-y-8">
      <PairDetailGlowSearch />
    </div>
  );
}
