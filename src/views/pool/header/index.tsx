import { ArrowIcon } from "@/components/common/arrow-icon";
import { Button } from "@/components/ui/button";
import type { PoolType } from "@/types/admin/master-pool-management";
import { Link } from "@tanstack/react-router";

interface Props {
  poolType: PoolType;
}

const PoolListHeader: React.FC<Props> = ({ poolType }) => {
  const text = poolType === 0 ? "burn" : "swap";

  return (
    <div className="mb-12.75 flex w-full items-center justify-between gap-10 pt-12.75 pr-13.5 pl-20.25">
      <h1 className="text-3xl font-semibold capitalize">{text} Pools List</h1>

      <Button
        variant={"mb-primary"}
        size={"mb-square-btn"}
        asChild
        className="gap-9.75 pr-10.5 pl-10.75"
      >
        <Link to={`/${text}/create`}>
          <span className="capitalize">Create {text} Pool</span>
          <ArrowIcon direction="right" />
        </Link>
      </Button>
    </div>
  );
};

export default PoolListHeader;
