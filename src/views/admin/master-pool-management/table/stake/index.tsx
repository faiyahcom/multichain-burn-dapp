import type { AdminPoolItemType } from "@/services/adminPoolManagementService";
import { useMasterPoolManagementStakeSearchFilterStore } from "@/stores/admin/master-pool-management/stake/search-filter-store";
import AdminMasterPoolManagementTableTemplate from "../template";

interface Props {
  data?: AdminPoolItemType[];
  isLoading?: boolean;
}

const AdminMasterPoolManagementTableStake: React.FC<Props> = ({
  data,
  isLoading,
}) => {
  const { filter, setFilter } = useMasterPoolManagementStakeSearchFilterStore();

  return (
    <AdminMasterPoolManagementTableTemplate
      poolType={2}
      data={data}
      isLoading={isLoading}
      sortBy={filter.sortBy}
      sortOrder={filter.sortOrder}
      onToggleSort={({ sortBy, sortOrder }) => {
        setFilter({ sortBy, sortOrder });
      }}
    />
  );
};

export default AdminMasterPoolManagementTableStake;
