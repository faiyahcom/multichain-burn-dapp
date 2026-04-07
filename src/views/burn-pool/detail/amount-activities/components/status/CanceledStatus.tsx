import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useAuthStore } from "@/stores/authStore";
import { formatAmount } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const CanceledStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
    } = useAmountActivity(poolDetail);
    const { user } = useAuthStore();
    const isPoolOwner = user?.address === poolDetail?.pool?.owner;
    const formattedReturning = poolDetail?.returningAmountOnCanceling
        ? formatAmount(
            poolDetail.returningAmountOnCanceling.amount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";

    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });
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
            {poolDetail?.pool?.status === "canceled" && isPoolOwner && (
                <div className="flex items-center justify-between text-active">
                    <span className="text-sm font-medium">Your reward token return</span>
                    <span className="text-sm font-bold">
                        {poolDetail ? (
                            <>
                                {formattedReturning} {rewardTokenDisplay.symbol}
                            </>
                        ) : (
                            <Skeleton className="h-7 w-32" />
                        )}
                    </span>
                </div>
            )}
        </>
    );
};

export default CanceledStatus;
