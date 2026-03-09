import CustomPagination from "@/components/common/pagination";
import { Route } from "@/routes/pair-detail/$chainId/$tokenIn/$tokenOut";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  userHiddenBurnPoolStatuses,
  userHiddenSwapPoolStatuses,
} from "@/types/admin/master-pool-management";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import PairDetailDetailListCardLayout from "./card";
import PairDetailDetailListListLayout from "./list";

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
        excludeStatuses: convertArrayToStringParam({
          array:
            filter.type === 0
              ? [...userHiddenBurnPoolStatuses]
              : [...userHiddenSwapPoolStatuses],
        }),
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
