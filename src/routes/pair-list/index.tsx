import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";
import PairListGlowList from "@/views/pair-list/glow/list";
import PairListGlowSearch from "@/views/pair-list/glow/search";
import PairListGlowSummary from "@/views/pair-list/glow/summary";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import z from "zod";

const pairListSearchSchema = z.object({
  tokenSearch: z.string().catch("").optional(),
});

type PairListSearch = z.infer<typeof pairListSearchSchema>;

export const Route = createFileRoute("/pair-list/")({
  validateSearch: (search): PairListSearch =>
    pairListSearchSchema.parse(search),
  component: RouteComponent,
});

function RouteComponent() {
  const { tokenSearch } = Route.useSearch();
  const { setFilter } = usePairListSearchFilterStore();

  useEffect(() => {
    if (tokenSearch) {
      setFilter({ text: tokenSearch });
    }
  }, [tokenSearch]);

  return (
    <div className="w-full space-y-4 xl:space-y-8">
      <PairListGlowSummary />
      <PairListGlowSearch />
      <PairListGlowList />
    </div>
  );
}
