import {
  IconArrowLeftRightOutline,
  IconFlameOutline,
  IconLockOutline,
  IconRocketOutline,
} from "@/assets/react";
import { FContainer, FSummarySection } from "@/components/common/fcontainer";
import CustomPagination from "@/components/common/pagination";
import { networkIdToChainId } from "@/config/networks";
import { adminPoolManagementService } from "@/services/adminPoolManagementService";
import { adminPoolManagementQueryKeys } from "@/services/queries/queryKey";
import {
  useMasterPoolManagementBurnSearchFilterStore,
  type MasterPoolManagementBurnSearchFilterType,
} from "@/stores/admin/master-pool-management/burn/search-filter-store";
import { useMasterPoolManagementLaunchpadSearchFilterStore } from "@/stores/admin/master-pool-management/launchpad/search-filter-store";
import {
  useMasterPoolManagementStakeSearchFilterStore,
  type MasterPoolManagementStakeSearchFilterType,
} from "@/stores/admin/master-pool-management/stake/search-filter-store";
import { useMasterPoolManagementSwapSearchFilterStore } from "@/stores/admin/master-pool-management/swap/search-filter-store";
import { useAuthStore } from "@/stores/authStore";
import {
  poolTypeLabels,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { dateToUnixSeconds } from "@/utils/helpers/date";
import AdminMasterPoolManagementHeader from "@/views/admin/master-pool-management/header";
import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import AdminMasterPoolManagementTable from "@/views/admin/master-pool-management/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo } from "react";

type Tab = "burn-pool" | "swap-pool" | "stake-pool" | "launchpad";

const validTabs: Tab[] = ["burn-pool", "swap-pool", "stake-pool", "launchpad"];
const isValidTab = (value: unknown): value is Tab =>
  typeof value === "string" && validTabs.includes(value as Tab);

const tabToPoolType: Record<Tab, PoolType> = {
  "burn-pool": 0,
  "swap-pool": 1,
  "stake-pool": 2,
  launchpad: 3,
};

const poolTypeIcons: Record<
  PoolType,
  React.ComponentType<{ className?: string }>
> = {
  0: IconFlameOutline,
  1: IconArrowLeftRightOutline,
  2: IconLockOutline,
  3: IconRocketOutline,
};
const limit = 20;

export const Route = createFileRoute("/admin/master-pool-management/")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== "admin" && role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isValidTab(search.tab) ? search.tab : "swap-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const poolType = tabToPoolType[tab];
  const isBurnPool = poolType === 0;
  const isStakePool = poolType === 2;
  const isLaunchpad = poolType === 3;
  const isBurnOrStakeOrLaunchpad = isBurnPool || isStakePool || isLaunchpad;
  const PoolIcon = poolTypeIcons[poolType];

  const { filter: burnFilter, setFilter: setBurnFilter } =
    useMasterPoolManagementBurnSearchFilterStore();
  const { filter: swapFilter, setFilter: setSwapFilter } =
    useMasterPoolManagementSwapSearchFilterStore();
  const { filter: stakeFilter, setFilter: setStakeFilter } =
    useMasterPoolManagementStakeSearchFilterStore();
  const { filter: launchpadFilter, setFilter: setLaunchpadFilter } =
    useMasterPoolManagementLaunchpadSearchFilterStore();

  const filter = useMemo(() => {
    switch (poolType) {
      case 0:
        return burnFilter;

      case 1:
        return swapFilter;

      case 2:
        return stakeFilter;

      case 3:
        return launchpadFilter;

      default:
        void (poolType satisfies never); // exhaustive check
        return undefined;
    }
  }, [poolType, burnFilter, swapFilter, stakeFilter, launchpadFilter]);

  const setFilter = useMemo(() => {
    switch (poolType) {
      case 0:
        return setBurnFilter;

      case 1:
        return setSwapFilter;

      case 2:
        return setStakeFilter;

      case 3:
        return setLaunchpadFilter;

      default:
        void (poolType satisfies never); // exhaustive check
        return () => {};
    }
  }, [
    poolType,
    setBurnFilter,
    setSwapFilter,
    setStakeFilter,
    setLaunchpadFilter,
  ]);

  const { data: poolsData, isPending: isPendingPools } = useQuery({
    queryKey: adminPoolManagementQueryKeys.list({
      ...filter,
      kind: poolType.toString(),
    }),
    queryFn: async () => {
      return adminPoolManagementService.getList({
        page: filter?.page ?? 1,
        limit: limit,
        chainIds: convertArrayToStringParam({
          array: filter?.network?.map((network) => networkIdToChainId(network)),
        }),
        isPartner:
          isBurnPool && burnFilter?.type === "partner" ? "true" : undefined,
        kind: poolType.toString(),
        lowRewardNotiEnabled:
          isStakePool && stakeFilter.type !== "all"
            ? stakeFilter?.type
            : undefined,
        search: filter?.text ?? undefined,
        sortBy: filter?.sortBy ?? "timestamp",
        sortDirection: filter?.sortOrder ?? "desc",
        statuses: convertArrayToStringParam({
          array: filter?.status?.map((status) => status.toString()),
        }),
        excludeStatuses: isStakePool || isLaunchpad ? undefined : "draft", // admin does not need to see draft pools (except for stake pool, launchpad)
        timeEndFrom: isBurnOrStakeOrLaunchpad
          ? dateToUnixSeconds({
              date: (
                filter as
                  | MasterPoolManagementBurnSearchFilterType
                  | MasterPoolManagementStakeSearchFilterType
              )?.poolEndRange?.from,
              mod: "startOfDay",
            })
          : undefined,
        timeEndTo: isBurnOrStakeOrLaunchpad
          ? dateToUnixSeconds({
              date: (
                filter as
                  | MasterPoolManagementBurnSearchFilterType
                  | MasterPoolManagementStakeSearchFilterType
              )?.poolEndRange?.to,
              mod: "endOfDay",
            })
          : undefined,
        timeStartFrom: isBurnOrStakeOrLaunchpad
          ? dateToUnixSeconds({
              date: (
                filter as
                  | MasterPoolManagementBurnSearchFilterType
                  | MasterPoolManagementStakeSearchFilterType
              )?.poolStartRange?.from,
              mod: "startOfDay",
            })
          : undefined,
        timeStartTo: isBurnOrStakeOrLaunchpad
          ? dateToUnixSeconds({
              date: (
                filter as
                  | MasterPoolManagementBurnSearchFilterType
                  | MasterPoolManagementStakeSearchFilterType
              )?.poolStartRange?.to,
              mod: "endOfDay",
            })
          : undefined,
        timestampFrom: dateToUnixSeconds({
          date: filter?.dateRange?.from,
          mod: "startOfDay",
        }),
        timestampTo: dateToUnixSeconds({
          date: filter?.dateRange?.to,
          mod: "endOfDay",
        }),
        tokens: convertArrayToStringParam({
          array: filter?.tokens,
        }),
        // TODO: add launchpad filter
      });
    },
  });

  return (
    <div className="flex min-h-full flex-col justify-between gap-2.5 pb-10 md:gap-5 md:pb-15">
      <div>
        <AdminMasterPoolManagementHeader poolType={poolType} />
        <FContainer className="mx-4 md:mr-3 md:ml-9.75">
          <div className="space-y-3 p-3 md:space-y-6 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-mb-gray-f45">
                {PoolIcon && <PoolIcon className="w-4 shrink-0" />}
              </div>
              <p className="text-2xl text-[#0F1D34] capitalize">
                {poolTypeLabels[poolType]}
              </p>
            </div>
            <AdminMasterPoolManagementSearch poolType={poolType} />
          </div>
          <AdminMasterPoolManagementTable
            poolType={poolType}
            data={poolsData?.pools}
            isLoading={isPendingPools}
          />
          <FSummarySection
            currentNumber={poolsData?.pools?.length || 0}
            totalNumber={poolsData?.total || 0}
            unit="pool"
          />
        </FContainer>
      </div>
      <CustomPagination
        currentPage={filter?.page ?? 1}
        totalCount={poolsData?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
}
