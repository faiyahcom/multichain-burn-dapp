import type { SearchParamTabOption } from "@/components/common/glow/search-param-tab";
import SearchParamTab from "@/components/common/glow/search-param-tab";
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
  const tabOptions: SearchParamTabOption<Tab>[] = [
    { label: "Burn Pools", value: "burn-pool" },
    { label: "Swap Pools", value: "swap-pool" },
    { label: "Claimable", value: "claimable" },
  ];

  const { filter: filterBurn, setFilter: setFilterBurn } =
    useMyParticipatedPoolsBurnSearchFilterStore();

  const { filter: filterSwap, setFilter: setFilterSwap } =
    useMyParticipatedPoolsSwapSearchFilterStore();

  const { filter: filterClaimable, setFilter: setFilterClaimable } =
    useMyParticipatedPoolsClaimableSearchFilterStore();

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
