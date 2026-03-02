import { useMemo } from "react";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const burnProgress = useMemo(() => {
        if (!poolDetail) return 0;
        return 1;
    }, [poolDetail]);
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail.rewardAmount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";
    const symbol = poolDetail?.pool.rewardTokenSymbol || "";
    return (
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-14 pb-4 text-xl font-medium">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span>Reward Amount</span>
                </div>
                <p>
                    {formattedReward} {symbol}
                </p>
            </div>
            <div>
                <p className="text-base text-greyed">
                    <span>Total Reward Amount:</span>{" "}
                    <span className="ml-14">
                        {formattedReward} {symbol} / {formattedReward} {symbol}
                    </span>
                </p>
                <div>
                    <div className="h-3.25 w-full rounded-[9.5px] bg-progress-bg">
                        <div
                            className="h-full rounded-[9.5px] bg-progress"
                            style={{ width: `${burnProgress * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardAmount;
