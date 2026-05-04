import { type PoolType } from "@/types/admin/master-pool-management";
import AdminMasterPoolManagementBurnSearch from "./burn";
import AdminMasterPoolManagementStakeSearch from "./stake";
import AdminMasterPoolManagementSwapSearch from "./swap";

interface Props {
  poolType: PoolType;
}

const AdminMasterPoolManagementSearch: React.FC<Props> = ({ poolType }) => {
  switch (poolType) {
    case 0:
      return <AdminMasterPoolManagementBurnSearch />;

    case 1:
      return <AdminMasterPoolManagementSwapSearch />;

    case 2:
      return <AdminMasterPoolManagementStakeSearch />;

    case 3:
      return null; // TODO: launchpad

    default:
      void (poolType satisfies never); // exhaustive check
      return null;
  }
};

export default AdminMasterPoolManagementSearch;
