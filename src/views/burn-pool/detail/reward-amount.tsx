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
            {poolDetail?.pool.status &&
                ["on_going", "ended", "closed"].includes(poolDetail.pool.status) && (
                    <div>
                        <p className="text-base text-greyed">
                            <span>Total Burned Amount:</span>{" "}
                            <span className="ml-14">
                                {formattedBurned} {poolDetail?.pool.tokenInSymbol}
                            </span>
                        </p>
                    </div>
                )}
        </div>
    );
};

export default RewardAmount;
