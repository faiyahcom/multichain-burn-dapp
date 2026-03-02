import type { PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const formattedBurned = poolDetail
        ? formatAmount(
            poolDetail.userAmount.deposited,
            poolDetail.pool.tokenInDecimals,
        )
        : "-";
    const formattedReward = poolDetail
        ? formatAmount(poolDetail.userAmount.claimed, poolDetail.pool.rewardTokenDecimals)
        : "-";
    return (
        <div className="mt-3 w-full space-y-3 px-6 py-4">
            <span className="flex items-center gap-2 text-xl font-medium">
                Amount & Activity
            </span>
            <div className="flex items-center justify-between text-active">
                <span className="text-sm font-medium">Claimed Reward</span>
                <span className="text-2xl font-bold">
                    {formattedReward} {poolDetail?.pool.rewardTokenSymbol}
                </span>
            </div>
            <div className="flex items-center justify-between text-greyed">
                <span className="text-sm">Your Burned Amount</span>
                <span className="text-sm">
                    {formattedBurned} {poolDetail?.pool.tokenInSymbol}
                </span>
            </div>
        </div>
    );
};

export default AmountAndActivity;
