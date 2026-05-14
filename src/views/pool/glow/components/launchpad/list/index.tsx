import GlowContainer from "@/components/common/glow/container";
import { useLaunchpadPoolListSearchFilterStore } from "@/stores/pool-list/search-filter-store";
import { useMediaQuery } from "usehooks-ts";
import LaunchpadPoolListGrid from "./grid";
import LaunchpadPoolListTable from "./table";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { useQuery } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum } from "@/types/pool";
import { poolService } from "@/services/poolService";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { networkIdToChainId } from "@/config/networks";
import { userHiddenLaunchpadPoolStatuses } from "@/types/admin/master-pool-management";

const LaunchpadPoolList = () => {
  const { filter, setFilter } = useLaunchpadPoolListSearchFilterStore();
  const { listLayout, ...filterWithoutListLayout } = filter;
  const limit = 12;
  const onlyShowCurrentPage = useMediaQuery("(max-width: 1024px)");

  const { data: poolList, isPending: isPoolListPending } = useQuery({
    queryKey: poolQueryKeys.list({
      type: PoolKindCodeEnum.Launchpad,
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
          array: [...userHiddenLaunchpadPoolStatuses],
        }),
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: PoolKindCodeEnum.Launchpad.toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  return (
    <GlowContainer
      variant="launchpad"
      className="space-y-5 px-2.5 py-3 sm:space-y-10 sm:px-5 sm:py-6"
    >
      {filter.listLayout === "list" && (
        <LaunchpadPoolListTable
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      {filter.listLayout === "card" && (
        <LaunchpadPoolListGrid
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
          variant="launchpad"
          onlyShowCurrentPage={onlyShowCurrentPage}
        />
      )}
    </GlowContainer>
  );
};

export default LaunchpadPoolList;
