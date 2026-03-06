import PairDetailDetail from "@/views/pair-detail/detail";
import PairDetailStatistics from "@/views/pair-detail/statistic";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/pair-detail/$chainId/$tokenIn/$tokenOut",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { chainId, tokenIn, tokenOut } = Route.useParams();
  console.log(chainId, tokenIn, tokenOut);
  return (
    <div className="flex gap-4.25 pt-9.5 pr-4.25 pb-10 pl-6.75">
      <PairDetailDetail />
      <PairDetailStatistics />
    </div>
  );
}
