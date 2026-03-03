import { useMemo } from "react";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail.pool.currentRewardAmount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";
    const formattedBurned = poolDetail
        ? formatAmount(poolDetail.depositedAmount, poolDetail.pool.tokenInDecimals)
        : "-";

    const maxBurn = useMemo(() => {
        if (!poolDetail) return 0;

        const num = Number(poolDetail.pool.rewardNumerator ?? 0); // N
        const den = Number(poolDetail.pool.rewardDenominator ?? 0); // D;

        if (!num || !den) return 0;

        // Raw amounts (not formatted)
        const rewardRaw = Number(poolDetail.rewardAmount);
        const rewardDecimals = poolDetail.pool.rewardTokenDecimals;
        const burnDecimals = poolDetail.pool.tokenInDecimals;

        // Convert reward to human readable
        const rewardHuman = rewardRaw / 10 ** rewardDecimals;

        // maxBurn in human readable
        const maxBurnHuman = rewardHuman * (num / den);

        return maxBurnHuman;
    }, [poolDetail]);
    const formattedMaxBurn = maxBurn
        ? formatAmount(
            (maxBurn * 10 ** poolDetail!.pool.tokenInDecimals).toString(),
            poolDetail!.pool.tokenInDecimals,
        )
        : "-";

    const burnProgress = Number(formattedBurned) / Number(maxBurn);
    return (
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-14 pb-4 text-xl font-medium">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span>Reward Amount</span>
                </div>
                <p>
                    {formattedReward} {poolDetail?.pool.rewardTokenSymbol}
                </p>
            </div>
            <div>
                <p className="text-base text-greyed">
                    <span>Total Burned Amount:</span>{" "}
                    <span className="ml-14">
                        {formattedBurned} / {formattedMaxBurn}{" "}
                        {poolDetail?.pool.tokenInSymbol}
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
