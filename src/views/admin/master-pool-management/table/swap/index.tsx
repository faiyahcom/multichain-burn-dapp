import { useMasterPoolManagementSwapSearchFilterStore } from "@/stores/admin/master-pool-management/swap/search-filter-store";
import AdminMasterPoolManagementTableTemplate from "../template";
import type { AdminPoolItemType } from "@/services/adminPoolManagementService";

interface Props {
  data?: AdminPoolItemType[];
  isLoading?: boolean;
}

const AdminMasterPoolManagementTableSwap: React.FC<Props> = ({
  data,
  isLoading,
}) => {
  const { filter, setFilter } = useMasterPoolManagementSwapSearchFilterStore();

  return (
    <AdminMasterPoolManagementTableTemplate
      poolType={1}
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

export default AdminMasterPoolManagementTableSwap;
