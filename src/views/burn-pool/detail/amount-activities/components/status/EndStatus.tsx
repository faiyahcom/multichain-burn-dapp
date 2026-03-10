import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const EndStatus = ({ poolDetail }: Props) => {
    const { pool, formattedReward, formattedBurned, handleClaim } = useAmountActivity(poolDetail);
    const [isLoading, setIsLoading] = useState(false);
    const canClaim = poolDetail?.userAmount.canClaim ?? false;

    const handleClaimWithLoading = async () => {
        setIsLoading(true);
        try {
            await handleClaim();
        } finally {
            setIsLoading(false);
        }
    };

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
            <ActionBtn letter="C" text="Claim" isLoading={isLoading} disabled={!canClaim} onClick={handleClaimWithLoading} />
        </>
    );
};

export default EndStatus;
