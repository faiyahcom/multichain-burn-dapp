import { type PoolType } from "@/types/admin/master-pool-management";
import AdminMasterPoolManagementTableBurn from "./burn";
import AdminMasterPoolManagementTableStake from "./stake";
import AdminMasterPoolManagementTableSwap from "./swap";
import type { AdminPoolItemType } from "@/services/adminPoolManagementService";

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
  switch (poolType) {
    case 0:
      return (
        <AdminMasterPoolManagementTableBurn data={data} isLoading={isLoading} />
      );

    case 1:
      return (
        <AdminMasterPoolManagementTableSwap data={data} isLoading={isLoading} />
      );

    case 2:
      return (
        <AdminMasterPoolManagementTableStake
          data={data}
          isLoading={isLoading}
        />
      );

    case 3:
      return null; // TODO: launchpad

    default:
      void (poolType satisfies never); // exhaustive check
      return null;
  }
};

export default AdminMasterPoolManagementTable;
