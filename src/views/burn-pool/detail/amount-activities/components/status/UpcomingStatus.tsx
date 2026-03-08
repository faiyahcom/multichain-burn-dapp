import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/ui/button";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedBurned,
    } = useAmountActivity(poolDetail);

    return (
        <>
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
                className="text-active"
                valueClassName="text-xl font-bold"
            />
            <StatRow label="Estimated Claimable Reward" value="0" />
            <Button className="w-full rounded-sm" disabled>
                Claim
            </Button>
            <Button className="w-full rounded-sm" disabled>
                Deposit
            </Button>
        </>
    );
};

export default UpcomingStatus;
