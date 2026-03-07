import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const CanceledStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
    } = useAmountActivity(poolDetail);

    return (
        <>
            <StatRow
                label="Claimed Reward"
                value={`${formattedReward} ${pool?.rewardTokenSymbol ?? ""}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
            />
        </>
    );
};

export default CanceledStatus;
