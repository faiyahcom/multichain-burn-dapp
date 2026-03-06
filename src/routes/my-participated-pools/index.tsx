import { createFileRoute } from "@tanstack/react-router";

const TABS = ["burn-pool", "swap-pool", "claimable"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  "burn-pool": "Burn Pool",
  "swap-pool": "Swap Pool",
  claimable: "Claimable",
};

export const Route = createFileRoute("/my-participated-pools/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (TABS.includes(search.tab as Tab) ? search.tab : "burn-pool") as Tab,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "burn-pool";

  return (
    <div className="p-6">
      <div className="text-lg font-semibold">{TAB_LABELS[activeTab]}</div>
    </div>
  );
}
