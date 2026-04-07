import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { IconExclaimation } from "@/assets/react";
import { useMemo } from "react";
import { shortenNumber } from "@/utils/helpers/numbers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
    const { pool, formattedBurned } = useAmountActivity(poolDetail);

    const estmatedReward = useMemo(() => {
        if (!poolDetail) return "-";
        if (!poolDetail?.userAmount)
            return `0 ${poolDetail?.pool?.rewardTokenSymbol}`;
        const amount =
            Number(poolDetail.userAmount) /
            Math.pow(10, poolDetail?.pool?.tokenInDecimals);
        console.log("Calculating reward with amount:", amount);
        if (isNaN(amount)) return `0 ${poolDetail?.pool?.rewardTokenSymbol}`;
        const reward =
            (amount / (Number(poolDetail.depositedAmount) || 1)) *
            (Number(poolDetail?.pool?.rewardAmount) /
                Math.pow(10, poolDetail?.pool?.rewardTokenDecimals));
        return `${shortenNumber({ number: reward })} ${poolDetail?.pool?.rewardTokenSymbol}`;
    }, [poolDetail]);

    return (
        <>
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
                className="text-active"
                valueClassName="text-xl font-bold"
            />
            <StatRow
                label="Estimated Claimable Reward"
                value={`${estmatedReward} ${pool?.rewardTokenSymbol ?? ""}`}
            />
            <div className="mx-6 inline-flex items-start gap-1">
                <IconExclaimation className="inline size-5 translate-y-0.5" />
                <span className="text-sm text-greyed">
                    This pool was emergency closed by admin.
                </span>
            </div>
        </>
    );
};

export default ClosedStatus;
