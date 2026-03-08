import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import PairDetailDetailListCardLayout from "./card";
import PairDetailDetailListListLayout from "./list";
import { useQuery } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { Route } from "@/routes/pair-detail/$chainId/$tokenIn/$tokenOut";
import { poolService } from "@/services/poolService";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import CustomPagination from "@/components/common/pagination";

const PairDetailDetailList = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();
  const { chainId, tokenIn, tokenOut } = Route.useParams();
  const limit = 18;

  const { data: pools, isPending: isPendingPools } = useQuery({
    queryKey: poolQueryKeys.list({ ...filter, chainId, tokenIn, tokenOut }),
    queryFn: async () => {
      return poolService.getPoolList({
        page: filter.page,
        limit,
        chainIds: chainId,
        tokenIn,
        tokenReward: tokenOut,
        excludeStatuses: "draft", // user do not need to see draft pool
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: filter.type?.toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  return (
    <div className="space-y-9">
      {filter.listLayout === "list" && (
        <PairDetailDetailListListLayout
          data={pools?.pools}
          isLoading={isPendingPools}
        />
      )}
      {filter.listLayout === "card" && (
        <PairDetailDetailListCardLayout
          data={pools?.pools}
          isLoading={isPendingPools}
        />
      )}
      <CustomPagination
        currentPage={filter.page}
        totalCount={pools?.total ?? 0}
        onPageChange={(page) => setFilter({ page })}
        pageSize={limit}
      />
    </div>
  );
};

export default PairDetailDetailList;
