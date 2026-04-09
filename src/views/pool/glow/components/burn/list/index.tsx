import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { networkIdToChainId } from "@/config/networks";
import { cn } from "@/lib/utils";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useBurnPoolListSearchFilterStore } from "@/stores/pool-list/search-filter-store";
import {
  poolTypes,
  userHiddenBurnPoolStatuses,
} from "@/types/admin/master-pool-management";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "usehooks-ts";
import BurnPoolListTable from "./table";
import BurnPoolListGrid from "./grid";

const BurnPoolList = () => {
  const { filter, setFilter } = useBurnPoolListSearchFilterStore();
  const { listLayout, ...filterWithoutListLayout } = filter;
  const limit = 12;
  const onlyShowCurrentPage = useMediaQuery("(max-width: 1024px)");

  const { data: poolList, isPending: isPoolListPending } = useQuery({
    queryKey: poolQueryKeys.list({
      type: poolTypes[0],
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
          array: [...userHiddenBurnPoolStatuses],
        }),
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: poolTypes[0].toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  return (
    <GlowContainer
      variant="burn"
      className={cn(
        "space-y-5 px-2.5 sm:space-y-10 sm:px-5",
        {
          "pt-2.25 pb-5.25 sm:pt-4.5 sm:pb-10.5": filter.listLayout === "list",
        },
        { "py-3 sm:py-6": filter.listLayout === "card" },
      )}
    >
      {filter.listLayout === "list" && (
        <BurnPoolListTable
          data={poolList?.pools}
          isLoading={isPoolListPending}
        />
      )}
      {filter.listLayout === "card" && (
        <BurnPoolListGrid
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
          variant="burn"
          onlyShowCurrentPage={onlyShowCurrentPage}
        />
      )}
    </GlowContainer>
  );
};

export default BurnPoolList;
