import ActivitiesHistory from "./activities-history";
import type { PoolDetailResponse } from "@/types/pool";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PoolHistory = ({ poolDetail }: Props) => {
    return (
        <div className="mt-3 w-full py-4 pr-7">
            <div className="flex items-center gap-2 pb-6">
                <div className="h-1.5 w-1.5 bg-black" />
                <span className="text-xl font-medium">Pool History</span>
            </div>

            <ActivitiesHistory poolDetail={poolDetail} />
        </div>
    );
};

export default PoolHistory;
