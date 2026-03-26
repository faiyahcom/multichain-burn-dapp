import GlowContainer from "@/components/common/glow/container";
import { networkIdToChainId } from "@/config/networks";
import { cn } from "@/lib/utils";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import PairListGlowListTable from "./table";
import CustomPagination from "@/components/common/glow/glow-pagination";

const PairListGlowList = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  const { listLayout, ...filterWithoutListLayout } = filter;
  const limit = 12;

  const { data: pairs, isPending: isPendingPairs } = useQuery({
    queryKey: pairQueryKeys.list(filterWithoutListLayout),
    queryFn: () =>
      pairService.getPairList({
        page: filter.page,
        limit: limit,
        chainIds: convertArrayToStringParam({
          array: filter.network.map((network) => networkIdToChainId(network)),
        }),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      }),
  });

  return (
    <GlowContainer
      variant="pair"
      className={cn("px-2.5 sm:px-5", {
        "space-y-5 py-4.75 sm:space-y-10 sm:py-9.5": listLayout === "list",
      })}
    >
      {listLayout === "list" && (
        <PairListGlowListTable data={pairs?.pairs} isLoading={isPendingPairs} />
      )}
      <CustomPagination
        currentPage={filter.page}
        totalCount={pairs?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
        variant="pair"
      />
    </GlowContainer>
  );
};

export default PairListGlowList;
