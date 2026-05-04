import {
  IconArrowLeftRightOutline,
  IconFlameOutline,
  IconLockOutline,
} from "@/assets/react";
import { FContainer } from "@/components/common/fcontainer";
import { useAuthStore } from "@/stores/authStore";
import {
  poolTypeLabels,
  type PoolType,
} from "@/types/admin/master-pool-management";
import AdminMasterPoolManagementHeader from "@/views/admin/master-pool-management/header";
import AdminMasterPoolManagementSearch from "@/views/admin/master-pool-management/search";
import { createFileRoute, redirect } from "@tanstack/react-router";

type Tab = "burn-pool" | "swap-pool" | "stake-pool";

const validTabs: Tab[] = ["burn-pool", "swap-pool", "stake-pool"];
const isValidTab = (value: unknown): value is Tab =>
  typeof value === "string" && validTabs.includes(value as Tab);

const tabToPoolType: Record<Tab, PoolType> = {
  "burn-pool": 0,
  "swap-pool": 1,
  "stake-pool": 2,
};

const poolTypeIcons: Record<
  PoolType,
  React.ComponentType<{ className?: string }>
> = {
  0: IconFlameOutline,
  1: IconArrowLeftRightOutline,
  2: IconLockOutline,
  3: IconFlameOutline, // TODO: subject to change
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
  const poolType = tabToPoolType[tab];
  const PoolIcon = poolTypeIcons[poolType];
  return (
    // <div className="space-y-5.5">
    //   <AdminMasterPoolManagementSearch />
    //   <AdminMasterPoolManagementTable />
    // </div>
    <div className="flex min-h-full flex-col justify-between gap-2.5 pb-10 md:gap-5 md:pb-15">
      <div>
        <AdminMasterPoolManagementHeader poolType={poolType} />
        <FContainer className="mx-4 md:mr-3 md:ml-9.75">
          <div className="space-y-3 border-b border-mb-gray-f45 p-3 md:space-y-6 md:p-6">
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
        </FContainer>
      </div>
    </div>
  );
}
