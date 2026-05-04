import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import AdminMasterPoolManagementTable from "@/views/admin/master-pool-management/table";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import type { PoolType } from "@/types/admin/master-pool-management";
import AdminMasterPoolManagementHeader from "@/views/admin/master-pool-management/header";
import { FContainer } from "@/components/common/fcontainer";

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
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isValidTab(search.tab) ? search.tab : "swap-pool",
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  const poolType = TabToPoolType[tab];
  return (
    // <div className="space-y-5.5">
    //   <AdminMasterPoolManagementSearch />
    //   <AdminMasterPoolManagementTable />
    // </div>
    <div className="flex min-h-full flex-col justify-between gap-2.5 pb-10 md:gap-5 md:pb-15">
      <div>
        <AdminMasterPoolManagementHeader poolType={poolType} />
        <FContainer className="mx-4 p-3 md:mr-3 md:ml-9.75 md:p-6"></FContainer>
      </div>
    </div>
  );
}
