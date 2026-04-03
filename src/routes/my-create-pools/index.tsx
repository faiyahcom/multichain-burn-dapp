import type { SearchParamTabOption } from "@/components/common/glow/search-param-tab";
import SearchParamTab from "@/components/common/glow/search-param-tab";
import { useMyCreatePoolsBurnSearchFilterStore } from "@/stores/my-create-pools/burn/search-filter-store";
import { useMyCreatePoolsSwapSearchFilterStore } from "@/stores/my-create-pools/swap/search-filter-store";
import type { PoolType } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import ProfileLayout from "@/views/profile/layout";
import ProfileMyCreatePool from "@/views/profile/my-create-pool";
import ProfilePoolSearch from "@/views/profile/pool/search";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

type Tab = "burn-pool" | "swap-pool";

const validTabs: Tab[] = ["burn-pool", "swap-pool"];
const isValidTab = (value: unknown): value is Tab =>
  typeof value === "string" && validTabs.includes(value as Tab);

const tabOptions: SearchParamTabOption<Tab>[] = [
  { label: "Burn Pools", value: "burn-pool" },
  { label: "Swap Pools", value: "swap-pool" },
];

const TabToPoolType: Record<Tab, PoolType> = {
  "burn-pool": PoolKindCodeEnum.Burn,
  "swap-pool": PoolKindCodeEnum.Swap,
};

export const Route = createFileRoute("/my-create-pools/")({
  validateSearch: (search: Record<string, Tab>) => ({
    tab: isValidTab(search.tab) ? search.tab : "burn-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const poolType = TabToPoolType[tab];
  const { filter: filterBurn, setFilter: setFilterBurn } =
    useMyCreatePoolsBurnSearchFilterStore();

  const { filter: filterSwap, setFilter: setFilterSwap } =
    useMyCreatePoolsSwapSearchFilterStore();

  const filter = useMemo(() => {
    switch (tab) {
      case "burn-pool":
        return filterBurn;
      case "swap-pool":
        return filterSwap;
      default:
        void (tab satisfies never); // exhaustive check
        return undefined;
    }
  }, [tab, filterBurn, filterSwap]);

  const setFilter = useMemo(() => {
    switch (tab) {
      case "burn-pool":
        return setFilterBurn;
      case "swap-pool":
        return setFilterSwap;
      default:
        void (tab satisfies never); // exhaustive check
        return undefined;
    }
  }, [tab, setFilterBurn, setFilterSwap]);

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
        profileType="my-create-pools"
      />
      <ProfileMyCreatePool poolType={poolType} />
    </ProfileLayout>
  );
}
