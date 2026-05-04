import type { PoolDetailResponse } from "@/types/pool";
import { IconExclaimation } from "@/assets/react";
import StakeStats from "./StakeStats";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
    return (
        <StakeStats
            poolDetail={poolDetail}
            stakeDisabled
            extraContent={
                <div className="inline-flex items-start gap-1">
                    <IconExclaimation className="inline size-5" />
                    <span className="text-sm text-mb-gray-b8">
                        This pool was emergency closed by admin.
                    </span>
                </div>
            }
        />
    );
};

export default ClosedStatus;
