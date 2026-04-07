import { usePoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";
import {
  userHiddenBurnPoolStatuses,
  userHiddenSwapPoolStatuses,
  type PoolType,
} from "@/types/admin/master-pool-management";
import PoolListTable from "./table";
import CustomPagination from "@/components/common/pagination";
import { networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import PoolListGrid from "./grid";
import { cn } from "@/lib/utils";

interface Props {
  poolType: PoolType;
}

const PoolList: React.FC<Props> = ({ poolType }) => {
  const isBurnPool = poolType === 0;
  const { filter, setFilter } = usePoolListSearchFilterStore(poolType);
  const limit = 18;

  const { data: poolList, isPending: isPoolListPending } = useQuery({
    queryKey: poolQueryKeys.list({
      type: poolType,
      ...filter,
    }),
    queryFn: async () => {
      return poolService.getPoolList({
        page: filter.page,
        limit: limit,
        chainIds: convertArrayToStringParam({
          array: filter.network?.map((network) => networkIdToChainId(network)),
        }),
        excludeStatuses: convertArrayToStringParam({
          array: [
            ...(isBurnPool
              ? userHiddenBurnPoolStatuses
              : userHiddenSwapPoolStatuses),
          ],
        }),
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: poolType.toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  return (
    <div
      className={cn("space-y-9.5 pb-10 pl-13.25", {
        "pr-17.25": filter.listLayout === "card",
      })}
    >
      {filter.listLayout === "list" && (
        <PoolListTable
          poolType={poolType}
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      {filter.listLayout === "card" && (
        <PoolListGrid
          poolType={poolType}
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      <CustomPagination
        currentPage={filter.page}
        totalCount={poolList?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
};

export default PoolList;
