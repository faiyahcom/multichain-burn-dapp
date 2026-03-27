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
import PairListGlowListGrid from "./grid";
import { useMediaQuery } from "usehooks-ts";

const PairListGlowList = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  const { listLayout, ...filterWithoutListLayout } = filter;
  const limit = 12;
  const onlyShowCurrentPage = useMediaQuery("(max-width: 1024px)");

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
      className={cn(
        {
          "space-y-5 px-2.5 py-4.75 sm:space-y-10 sm:px-5 sm:py-9.5":
            listLayout === "list",
        },
        {
          "space-y-8.5 p-3 sm:space-y-17 sm:p-6": listLayout === "card",
        },
      )}
    >
      {listLayout === "list" && (
        <PairListGlowListTable data={pairs?.pairs} isLoading={isPendingPairs} />
      )}
      {listLayout === "card" && (
        <PairListGlowListGrid data={pairs?.pairs} isLoading={isPendingPairs} />
      )}
      {!!pairs?.pairs?.length && (
        <CustomPagination
          currentPage={filter.page}
          totalCount={pairs?.total || 0}
          pageSize={limit}
          onPageChange={(page) => setFilter({ page })}
          variant="pair"
          onlyShowCurrentPage={onlyShowCurrentPage}
        />
      )}
    </GlowContainer>
  );
};

export default PairListGlowList;
