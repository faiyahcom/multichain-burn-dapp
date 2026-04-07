import type { PoolType } from "@/types/admin/master-pool-management";
import PoolListHeader from "./header";
import PoolList from "./list";
import PoolListSearch from "./search";

interface Props {
  poolType: PoolType;
}

const CommonPoolLayout: React.FC<Props> = ({ poolType }) => {
  return (
    <>
      <PoolListHeader poolType={poolType} />
      <PoolListSearch poolType={poolType} />
      <PoolList poolType={poolType} />
    </>
  );
};

export default CommonPoolLayout;
