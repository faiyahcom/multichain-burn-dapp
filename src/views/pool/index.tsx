import type { PoolType } from "@/types/admin/master-pool-management";
import PoolListHeader from "./header";
import PoolListSearch from "./search";
import PoolListTable from "./table";

interface Props {
  poolType: PoolType;
}

const CommonPoolLayout: React.FC<Props> = ({ poolType }) => {
  return (
    <>
      <PoolListHeader poolType={poolType} />
      <PoolListSearch />
      <PoolListTable />
    </>
  );
};

export default CommonPoolLayout;
