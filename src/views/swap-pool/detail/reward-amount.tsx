import type { PoolDetailResponse } from "@/services/poolService";
import { useMemo } from "react";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const burnProgress = useMemo(() => {
        if (!poolDetail) return 0;
        return 1;
    }, [poolDetail]);
    return (
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-14 text-xl font-medium pb-4">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span>Reward Amount</span>
                </div>
                <p>{poolDetail?.totalRewardAmount}</p>
            </div>
            <div>
                <p className="text-base text-greyed">
                    <span>Total Reward Amount:</span>{" "}
                    <span className="ml-14">{poolDetail?.totalRewardAmount} / {poolDetail?.totalRewardAmount}</span>
                </p>
                <div>
                    <div className="h-3.25 w-full bg-progress-bg rounded-[9.5px]">
                        <div className="h-full bg-progress rounded-[9.5px]" style={{ width: `${burnProgress * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardAmount;
