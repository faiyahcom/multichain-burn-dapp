import CustomPagination from "@/components/common/pagination";
import { networkIdToChainId } from "@/config/networks";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import PairListListCardLayout from "./card";
import PairListListListLayout from "./list";

const PairListList = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  const limit = 18;

  const { data: pairs, isPending: isPendingPairs } = useQuery({
    queryKey: pairQueryKeys.list(filter),
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
    <div className="space-y-10">
      {filter.listLayout === "list" && (
        <PairListListListLayout
          data={pairs?.pairs}
          isLoading={isPendingPairs}
        />
      )}
      {filter.listLayout === "card" && (
        <PairListListCardLayout
          data={pairs?.pairs}
          isLoading={isPendingPairs}
        />
      )}
      <CustomPagination
        currentPage={filter.page}
        totalCount={pairs?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
};

export default PairListList;
