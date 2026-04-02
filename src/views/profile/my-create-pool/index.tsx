import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { useMyCreatePoolsBurnSearchFilterStore } from "@/stores/my-create-pools/burn/search-filter-store";
import { useMyCreatePoolsSwapSearchFilterStore } from "@/stores/my-create-pools/swap/search-filter-store";
import type {
  PoolListRequest,
  PoolType,
} from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ProfilePoolListBurn from "../pool/list/burn";
import { useMediaQuery } from "usehooks-ts";
import ProfilePoolListSwap from "../pool/list/swap";

interface Props {
  poolType: PoolType;
}

const ProfileMyCreatePool: React.FC<Props> = ({ poolType }) => {
  const { filter: filterBurn, setFilter: setFilterBurn } =
    useMyCreatePoolsBurnSearchFilterStore();
  const { filter: filterSwap, setFilter: setFilterSwap } =
    useMyCreatePoolsSwapSearchFilterStore();
  const { user } = useAuthStore();
  const limit = 10;
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const filter = useMemo(() => {
    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        return filterBurn;
      case PoolKindCodeEnum.Swap:
        return filterSwap;
      default:
        void (poolType satisfies never); // exhaustive check
        return undefined;
    }
  }, [poolType, filterBurn, filterSwap]);

  const setFilter = useMemo(() => {
    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        return setFilterBurn;
      case PoolKindCodeEnum.Swap:
        return setFilterSwap;
      default:
        void (poolType satisfies never); // exhaustive check
        return undefined;
    }
  }, [poolType, setFilterBurn, setFilterSwap]);

  const ownerQueryParams: PoolListRequest = {
    page: filter?.page ?? 1,
    limit: limit,
    kind: poolType.toString(),
    includeStatuses: convertArrayToStringParam({ array: filter?.status }),
    chainIds: convertArrayToStringParam({
      array: filter?.network?.map(networkIdToChainId)?.filter(Boolean) ?? [],
    }),
    search: filter?.text ?? undefined,
    sortBy: filter?.sortBy,
    sortDirection: filter?.sortOrder,
    owner: user?.address,
  };

  const { data: ownerPools, isPending: isOwnerPoolsPending } = useQuery({
    queryKey: poolQueryKeys.list(ownerQueryParams),
    queryFn: () => poolService.getPoolList(ownerQueryParams),
    enabled: !!user?.address,
  });

  return (
    <GlowContainer
      variant="pair"
      className="space-y-5 px-5.75 py-3 sm:space-y-10 sm:px-11.5 sm:py-6"
    >
      {poolType === PoolKindCodeEnum.Burn && (
        <ProfilePoolListBurn
          data={ownerPools?.pools}
          isLoading={isOwnerPoolsPending}
          limit={limit}
        />
      )}
      {poolType === PoolKindCodeEnum.Swap && (
        <ProfilePoolListSwap
          data={ownerPools?.pools}
          isLoading={isOwnerPoolsPending}
          limit={limit}
        />
      )}
      <CustomPagination
        currentPage={filter?.page ?? 1}
        onPageChange={(page) => setFilter?.({ page })}
        pageSize={limit}
        totalCount={ownerPools?.total ?? 0}
        variant="pair"
        onlyShowCurrentPage={!isDesktop}
      />
    </GlowContainer>
  );
};

export default ProfileMyCreatePool;
