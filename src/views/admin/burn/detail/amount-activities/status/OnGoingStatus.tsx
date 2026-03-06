import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const OnGoingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedBurned,
        formattedReturnReward,
        handleAdminClose,
    } = useAmountActivity(poolDetail);

    return (
        <>
            <StatRow
                label="Remaining Reward"
                value={`${formattedReturnReward} ${pool?.rewardTokenSymbol ?? ""}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Burn Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
            />
            <ActionBtn letter="C" text="Close Pool" color="#FF8E97" onClick={handleAdminClose} />
        </>
    );
};

export default OnGoingStatus;
