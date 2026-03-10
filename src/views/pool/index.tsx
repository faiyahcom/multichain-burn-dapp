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
      <PoolListSearch poolType={poolType} />
      <PoolListTable poolType={poolType} />
    </>
  );
};

export default CommonPoolLayout;
