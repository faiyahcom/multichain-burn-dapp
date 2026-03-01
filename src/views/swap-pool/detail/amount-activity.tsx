import type { PoolDetailResponse } from "@/types/pool";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    return (
        <div className="mt-3 w-full py-4 space-y-3 px-6 ">
            <span className="text-xl flex items-center gap-2 font-medium">
                Amount & Activity
            </span>
            <div className="flex justify-between items-center text-active">
                <span className="font-medium text-sm">Claimed Reward</span>
                <span className="font-bold text-2xl">0 {poolDetail?.pool.rewardTokenSymbol}</span>
            </div>
            <div className="flex justify-between items-center text-greyed">
                <span className="text-sm">Your Burned Amount</span>
                <span className="text-sm">0 {poolDetail?.pool.tokenInSymbol}</span>
            </div>
        </div>
    );
};

export default AmountAndActivity;
