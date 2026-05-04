import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import AdminMasterPoolManagementTable from "@/views/admin/master-pool-management/table";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import type { PoolType } from "@/types/admin/master-pool-management";

type Tab = "burn-pool" | "swap-pool" | "stake-pool";

const validTabs: Tab[] = ["burn-pool", "swap-pool", "stake-pool"];
const isValidTab = (value: unknown): value is Tab =>
  typeof value === "string" && validTabs.includes(value as Tab);

const TabToPoolType: Record<Tab, PoolType> = {
  "burn-pool": 0,
  "swap-pool": 1,
  "stake-pool": 2,
};

export const Route = createFileRoute("/admin/master-pool-management/")({
  beforeLoad: () => {
    const role = useAuthStore.getState().user?.role;
    if (role !== "admin" && role !== "super_admin") {
      throw redirect({ to: "/" });
    }
  },
  validateSearch: (search: Record<string, Tab>) => ({
    tab: isValidTab(search.tab) ? search.tab : "swap-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-5.5">
      <AdminMasterPoolManagementSearch />
      <AdminMasterPoolManagementTable />
    </div>
  );
}
