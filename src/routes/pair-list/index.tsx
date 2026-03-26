import PairListGlowList from "@/views/pair-list/glow/list";
import PairListGlowSearch from "@/views/pair-list/glow/search";
import PairListGlowSummary from "@/views/pair-list/glow/summary";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pair-list/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-full space-y-4 xl:space-y-8">
      <PairListGlowSummary />
      <PairListGlowSearch />
      <PairListGlowList />
    </div>
  );
}
