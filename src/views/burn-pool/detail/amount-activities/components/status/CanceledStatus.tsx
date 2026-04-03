import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useAuthStore } from "@/stores/authStore";
import { formatAmount } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";

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
    const isPoolOwner = user?.address === poolDetail?.pool.owner;
    const formattedReturning = poolDetail?.returningAmountOnCanceling
        ? formatAmount(
            poolDetail.returningAmountOnCanceling.amount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    return (
        <>
            <StatRow
                label="Claimed Reward"
                value={
                    <div className="inline-flex items-center gap-2.5">
                        {formattedReward}
                        <TokenDisplay
                            symbol={poolDetail?.tokenOut?.symbol}
                            customSymbol={poolDetail?.tokenOut?.customSymbol}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-2.5",
                            }}
                        />
                    </div>
                }
                className="text-burn-border/85"
                valueClassName="text-xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={
                    <div className="inline-flex items-center gap-1.5">
                        {formattedBurned}
                        <TokenDisplay
                            symbol={poolDetail?.tokenIn?.symbol}
                            customSymbol={poolDetail?.tokenIn?.customSymbol}
                            imageUri={burnTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-3.5 md:size-4 2xl:size-4.25",
                                container: "inline-flex items-center gap-1.5",
                            }}
                        />
                    </div>
                }
            />
            {poolDetail?.pool.status === "canceled" && isPoolOwner && (
                <div className="mb-3 flex items-center justify-between text-mb-burn">
                    <span className="text-sm font-medium">Your reward token return</span>
                    <span className="text-sm font-bold">
                        {poolDetail ? (
                            <div className="inline-flex items-center gap-2.5">
                                {formattedReturning}
                                <TokenDisplay
                                    symbol={poolDetail?.tokenOut?.symbol}
                                    customSymbol={poolDetail?.tokenOut?.customSymbol}
                                    imageUri={rewardTokenDisplay.imageUri ?? undefined}
                                    classNames={{
                                        img: "size-4 md:size-5 2xl:size-5.75",
                                        container: "inline-flex items-center gap-2.5",
                                    }}
                                />
                            </div>
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
