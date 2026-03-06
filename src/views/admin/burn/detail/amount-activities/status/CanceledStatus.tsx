import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const CanceledStatus = ({ poolDetail }: Props) => {
    const { pool, formattedReturnReward } = useAmountActivity(poolDetail);

    return (
        <StatRow
            label="Your reward token return:"
            value={`${formattedReturnReward} ${pool?.rewardTokenSymbol ?? ""}`}
            valueClassName="text-sm font-medium"
        />
    );
};

export default CanceledStatus;
