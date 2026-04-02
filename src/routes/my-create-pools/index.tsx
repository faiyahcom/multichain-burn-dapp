import type { SearchParamTabOption } from "@/components/common/glow/search-param-tab";
import SearchParamTab from "@/components/common/glow/search-param-tab";
import ProfileLayout from "@/views/profile/layout";
import UserBurnPools from "@/views/user-pools/burn-pool";
import UserSwapPools from "@/views/user-pools/swap-pool";
import { createFileRoute } from "@tanstack/react-router";

type Tab = "burn-pool" | "swap-pool";

const tabOptions: SearchParamTabOption<Tab>[] = [
  { label: "Burn Pools", value: "burn-pool" },
  { label: "Swap Pools", value: "swap-pool" },
];

export const Route = createFileRoute("/my-create-pools/")({
  validateSearch: (search: Record<string, Tab>) => ({
    tab: search.tab ?? "burn-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch() as { tab: Tab };

  // if (tab === 'swap-pool')
  //   return <UserSwapPools mode="owner" title="My Created Pools" />

  // return <UserBurnPools mode="owner" title="My Created Pools" />

  return (
    <ProfileLayout>
      <SearchParamTab
        currentValue={tab}
        options={tabOptions}
        searchParamKey="tab"
      />
    </ProfileLayout>
  );
}
