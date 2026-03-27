import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { cn } from "@/lib/utils";
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
import PairDetailGlowListTable from "./table";
import { useMediaQuery } from "usehooks-ts";
import PairDetailGlowListGrid from "./grid";

const PairDetailGlowList = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();
  const { listLayout, ...restFilter } = filter;
  const { chainId, tokenIn, tokenOut } = Route.useParams();
  const limit = 12;
  const onlyShowCurrentPage = useMediaQuery("(max-width: 1024px)");

  const { data: pools, isPending: isPendingPools } = useQuery({
    queryKey: poolQueryKeys.list({ ...restFilter, chainId, tokenIn, tokenOut }),
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
    <GlowContainer
      variant="pair"
      className={cn("space-y-5 p-2.5 sm:space-y-10 sm:p-5", {
        "pt-0 sm:pt-0": listLayout === "list",
      })}
    >
      {listLayout === "list" && (
        <PairDetailGlowListTable
          data={pools?.pools}
          isLoading={isPendingPools}
        />
      )}
      {listLayout === "card" && (
        <PairDetailGlowListGrid
          data={pools?.pools}
          isLoading={isPendingPools}
        />
      )}
      {!!pools?.pools?.length && (
        <CustomPagination
          currentPage={filter.page}
          totalCount={pools?.total || 0}
          pageSize={limit}
          onPageChange={(page) => setFilter({ page })}
          variant="pair"
          onlyShowCurrentPage={onlyShowCurrentPage}
        />
      )}
    </GlowContainer>
  );
};

export default PairDetailGlowList;
