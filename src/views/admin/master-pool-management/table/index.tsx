import type { AdminPoolItemType } from "@/services/adminPoolManagementService";
import { useMasterPoolManagementBurnSearchFilterStore } from "@/stores/admin/master-pool-management/burn/search-filter-store";
import { useMasterPoolManagementStakeSearchFilterStore } from "@/stores/admin/master-pool-management/stake/search-filter-store";
import { useMasterPoolManagementSwapSearchFilterStore } from "@/stores/admin/master-pool-management/swap/search-filter-store";
import { type PoolType } from "@/types/admin/master-pool-management";
import AdminMasterPoolManagementTableTemplate from "./template";
import { useMasterPoolManagementLaunchpadSearchFilterStore } from "@/stores/admin/master-pool-management/launchpad/search-filter-store";

interface Props {
  poolType: PoolType;
  data?: AdminPoolItemType[];
  isLoading?: boolean;
}

const AdminMasterPoolManagementTable: React.FC<Props> = ({
  poolType,
  data,
  isLoading,
}) => {
  const { filter: burnFilter, setFilter: setBurnFilter } =
    useMasterPoolManagementBurnSearchFilterStore();
  const { filter: swapFilter, setFilter: setSwapFilter } =
    useMasterPoolManagementSwapSearchFilterStore();
  const { filter: stakeFilter, setFilter: setStakeFilter } =
    useMasterPoolManagementStakeSearchFilterStore();
  const { filter: launchpadFilter, setFilter: setLaunchpadFilter } =
    useMasterPoolManagementLaunchpadSearchFilterStore();
  switch (poolType) {
    case 0:
      return (
        <AdminMasterPoolManagementTableTemplate
          poolType={0}
          data={data}
          isLoading={isLoading}
          sortBy={burnFilter.sortBy}
          sortOrder={burnFilter.sortOrder}
          onToggleSort={({ sortBy, sortOrder }) => {
            setBurnFilter({ sortBy, sortOrder });
          }}
        />
      );

    case 1:
      return (
        <AdminMasterPoolManagementTableTemplate
          poolType={1}
          data={data}
          isLoading={isLoading}
          sortBy={swapFilter.sortBy}
          sortOrder={swapFilter.sortOrder}
          onToggleSort={({ sortBy, sortOrder }) => {
            setSwapFilter({ sortBy, sortOrder });
          }}
        />
      );

    case 2:
      return (
        <AdminMasterPoolManagementTableTemplate
          poolType={2}
          data={data}
          isLoading={isLoading}
          sortBy={stakeFilter.sortBy}
          sortOrder={stakeFilter.sortOrder}
          onToggleSort={({ sortBy, sortOrder }) => {
            setStakeFilter({ sortBy, sortOrder });
          }}
        />
      );

    case 3:
      return (
        <AdminMasterPoolManagementTableTemplate
          poolType={3}
          data={data}
          isLoading={isLoading}
          sortBy={launchpadFilter.sortBy}
          sortOrder={launchpadFilter.sortOrder}
          onToggleSort={({ sortBy, sortOrder }) => {
            setLaunchpadFilter({ sortBy, sortOrder });
          }}
        />
      );

    default:
      void (poolType satisfies never); // exhaustive check
      return null;
  }
};

export default AdminMasterPoolManagementTable;
