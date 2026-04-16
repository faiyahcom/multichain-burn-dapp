import GlowContainer from "@/components/common/glow/container";
import { networkIdToChainId } from "@/config/networks";
import { userQueryKeys } from "@/services/queries/queryKey";
import {
  userService,
  type GetParticipatedPoolsByUserParams,
} from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMyParticipatedPoolsBurnSearchFilterStore } from "@/stores/my-participated-pools/burn";
import { useMyParticipatedPoolsSwapSearchFilterStore } from "@/stores/my-participated-pools/swap";
import type { PoolType } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useMediaQuery } from "usehooks-ts";
import ProfilePoolListBurn from "../pool/list/burn";
import ProfilePoolListSwap from "../pool/list/swap";
import CustomPagination from "@/components/common/glow/glow-pagination";
import { useMyParticipatedPoolsStakeSearchFilterStore } from "@/stores/my-participated-pools/stake";
import ProfilePoolListStake from "../pool/list/stake";

interface Props {
  poolType: PoolType;
}

const ProfileMyParticipatedPools: React.FC<Props> = ({ poolType }) => {
  const { filter: filterBurn, setFilter: setFilterBurn } =
    useMyParticipatedPoolsBurnSearchFilterStore();
  const { filter: filterSwap, setFilter: setFilterSwap } =
    useMyParticipatedPoolsSwapSearchFilterStore();
  const { filter: filterStake, setFilter: setFilterStake } =
    useMyParticipatedPoolsStakeSearchFilterStore();
  const { user } = useAuthStore();
  const limit = 10;
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const filter = useMemo(() => {
    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        return filterBurn;
      case PoolKindCodeEnum.Swap:
        return filterSwap;
      case PoolKindCodeEnum.Stake:
        return filterStake;
      case PoolKindCodeEnum.Launchpad:
        return undefined;
      default:
        void (poolType satisfies never); // exhaustive check
        return undefined;
    }
  }, [poolType, filterBurn, filterSwap, filterStake]);

  const setFilter = useMemo(() => {
    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        return setFilterBurn;
      case PoolKindCodeEnum.Swap:
        return setFilterSwap;
      case PoolKindCodeEnum.Stake:
        return setFilterStake;
      case PoolKindCodeEnum.Launchpad:
        return undefined;
      default:
        void (poolType satisfies never); // exhaustive check
        return undefined;
    }
  }, [poolType, setFilterBurn, setFilterSwap, setFilterStake]);

  const participatedQueryParams: GetParticipatedPoolsByUserParams = {
    page: filter?.page ?? 1,
    limit: limit,
    kind: poolType.toString(),
    includeStatuses: convertArrayToStringParam({ array: filter?.status }),
    chainIds: convertArrayToStringParam({
      array: filter?.network?.map(networkIdToChainId)?.filter(Boolean) ?? [],
    }),
    search: filter?.text || undefined,
    sortBy: filter?.sortBy,
    sortDirection: filter?.sortOrder,
  };

  const { data: participatedData, isPending: isParticipatedPending } = useQuery(
    {
      queryKey: userQueryKeys.participatedPools(participatedQueryParams),
      queryFn: () =>
        userService.getParticipatedPoolsByUser(participatedQueryParams),
      enabled: !!user?.address,
    },
  );

  return (
    <GlowContainer
      variant="pair"
      className="space-y-5 px-5.75 py-3 sm:space-y-10 sm:px-11.5 sm:py-6"
    >
      {poolType === PoolKindCodeEnum.Burn && (
        <ProfilePoolListBurn
          data={participatedData?.pools}
          isLoading={isParticipatedPending}
          limit={limit}
        />
      )}
      {poolType === PoolKindCodeEnum.Swap && (
        <ProfilePoolListSwap
          data={participatedData?.pools}
          isLoading={isParticipatedPending}
          limit={limit}
        />
      )}
      {poolType === PoolKindCodeEnum.Stake && (
        <ProfilePoolListStake
          data={participatedData?.pools}
          isLoading={isParticipatedPending}
          limit={limit}
        />
      )}
      <CustomPagination
        currentPage={filter?.page ?? 1}
        onPageChange={(page) => setFilter?.({ page })}
        pageSize={limit}
        totalCount={participatedData?.total ?? 0}
        variant="pair"
        onlyShowCurrentPage={!isDesktop}
      />
    </GlowContainer>
  );
};

export default ProfileMyParticipatedPools;
