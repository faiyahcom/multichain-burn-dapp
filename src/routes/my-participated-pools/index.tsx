import { getVariantBtnBgClassName } from "@/components/common/glow/container";
import type { SearchParamTabOption } from "@/components/common/glow/search-param-tab";
import SearchParamTab from "@/components/common/glow/search-param-tab";
import { cn } from "@/lib/utils";
import { userQueryKeys } from "@/services/queries/queryKey";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMyParticipatedPoolsBurnSearchFilterStore } from "@/stores/my-participated-pools/burn";
import { useMyParticipatedPoolsClaimableSearchFilterStore } from "@/stores/my-participated-pools/claimable";
import { useMyParticipatedPoolsSwapSearchFilterStore } from "@/stores/my-participated-pools/swap";
import {
  isPoolType,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import ProfileLayout from "@/views/profile/layout";
import ProfileMyParticipatedPools from "@/views/profile/my-participated-pools";
import ProfileMyParticipatedPoolsClaimable from "@/views/profile/my-participated-pools/claimable";
import ProfilePoolSearch from "@/views/profile/pool/search";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

type Tab = "burn-pool" | "swap-pool" | "claimable";

const validTabs: Tab[] = ["burn-pool", "swap-pool", "claimable"];
const isValidTab = (value: unknown): value is Tab =>
  typeof value === "string" && validTabs.includes(value as Tab);

const TabToPoolType: Record<Tab, PoolType | "claimable"> = {
  "burn-pool": PoolKindCodeEnum.Burn,
  "swap-pool": PoolKindCodeEnum.Swap,
  claimable: "claimable",
};

export const Route = createFileRoute("/my-participated-pools/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isValidTab(search.tab) ? search.tab : "burn-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const poolType = TabToPoolType[tab];
  const { user, accessToken, _hasHydrated } = useAuthStore();

  const { filter: filterBurn, setFilter: setFilterBurn } =
    useMyParticipatedPoolsBurnSearchFilterStore();

  const { filter: filterSwap, setFilter: setFilterSwap } =
    useMyParticipatedPoolsSwapSearchFilterStore();

  const { filter: filterClaimable, setFilter: setFilterClaimable } =
    useMyParticipatedPoolsClaimableSearchFilterStore();

  const { data: claimableCount } = useQuery({
    queryKey: userQueryKeys.claimableCount({
      id: user?.id,
    }),
    queryFn: async () => {
      return userService.getClaimableCount();
    },
    enabled: !!accessToken && _hasHydrated,
  });

  const tabOptions: SearchParamTabOption<Tab>[] = [
    { label: "Burn Pool", value: "burn-pool" },
    { label: "Swap Pool", value: "swap-pool" },
    {
      label: "Claimable",
      value: "claimable",
      rightAddons: (
        <div
          className={cn(
            "text-xl font-medium text-foreground sm:text-2xl text-center",
            "rounded-full px-2.5 py-1.25 shrink-0 min-w-9.5 sm:min-w-10.5",
            getVariantBtnBgClassName({ variant: "pair" }),
          )}
        >
          {claimableCount?.total ?? 0}
        </div>
      ),
    },
  ];

  const filter = useMemo(() => {
    switch (tab) {
      case "burn-pool":
        return filterBurn;
      case "swap-pool":
        return filterSwap;
      case "claimable":
        return filterClaimable;
      default:
        void (tab satisfies never); // exhaustive check
        return undefined;
    }
  }, [tab, filterBurn, filterSwap, filterClaimable]);

  const setFilter = useMemo(() => {
    switch (tab) {
      case "burn-pool":
        return setFilterBurn;
      case "swap-pool":
        return setFilterSwap;
      case "claimable":
        return setFilterClaimable;
      default:
        void (tab satisfies never); // exhaustive check
        return undefined;
    }
  }, [tab, setFilterBurn, setFilterSwap, setFilterClaimable]);

  return (
    <ProfileLayout>
      <SearchParamTab
        currentValue={tab}
        options={tabOptions}
        searchParamKey="tab"
      />
      <ProfilePoolSearch
        filter={filter}
        setFilter={setFilter}
        poolType={poolType}
        profileType="my-participated-pools"
      />
      {isPoolType(poolType) ? (
        <ProfileMyParticipatedPools poolType={poolType} />
      ) : (
        poolType === "claimable" && <ProfileMyParticipatedPoolsClaimable />
      )}
    </ProfileLayout>
  );
}
