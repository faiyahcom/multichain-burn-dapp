import type { AdminPoolItemType } from "@/services/adminPoolManagementService";
import { useMasterPoolManagementBurnSearchFilterStore } from "@/stores/admin/master-pool-management/burn/search-filter-store";
import AdminMasterPoolManagementTableTemplate from "../template";

interface Props {
  data?: AdminPoolItemType[];
  isLoading?: boolean;
}

const AdminMasterPoolManagementTableBurn: React.FC<Props> = ({
  data,
  isLoading,
}) => {
  const { filter, setFilter } = useMasterPoolManagementBurnSearchFilterStore();

  return (
    <AdminMasterPoolManagementTableTemplate
      poolType={0}
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

export default AdminMasterPoolManagementTableBurn;
