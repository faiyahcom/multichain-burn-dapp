import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useStakePoolListSearchFilterStore } from "@/stores/pool-list/search-filter-store";
import { userHiddenStakePoolStatuses } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "usehooks-ts";
import StakePoolListGrid from "./grid";
import StakePoolListTable from "./table";

const StakePoolList = () => {
  const { filter, setFilter } = useStakePoolListSearchFilterStore();
  const { listLayout, ...filterWithoutListLayout } = filter;
  const limit = 12;
  const onlyShowCurrentPage = useMediaQuery("(max-width: 1024px)");

  const { data: poolList, isPending: isPoolListPending } = useQuery({
    queryKey: poolQueryKeys.list({
      type: PoolKindCodeEnum.Stake,
      ...filterWithoutListLayout,
    }),
    queryFn: async () => {
      return poolService.getPoolList({
        page: filter.page,
        limit: limit,
        chainIds: convertArrayToStringParam({
          array: filter.network?.map((network) => networkIdToChainId(network)),
        }),
        excludeStatuses: convertArrayToStringParam({
          array: [...userHiddenStakePoolStatuses],
        }),
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: PoolKindCodeEnum.Stake.toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  return (
    <GlowContainer variant="stake" className="px-2.5 py-3 sm:px-5 sm:py-6">
      {filter.listLayout === "list" && (
        <StakePoolListTable
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      {filter.listLayout === "card" && (
        <StakePoolListGrid
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      {!!poolList?.pools?.length && (
        <CustomPagination
          currentPage={filter.page}
          totalCount={poolList?.total || 0}
          pageSize={limit}
          onPageChange={(page) => setFilter({ page })}
          variant="stake"
          onlyShowCurrentPage={onlyShowCurrentPage}
        />
      )}
    </GlowContainer>
  );
};

export default StakePoolList;
