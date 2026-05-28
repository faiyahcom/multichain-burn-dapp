import type { PoolDetailResponse } from "@/types/pool";
import { StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { IconExclaimation } from "@/assets/react";
import { useMemo } from "react";
import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
    const { formattedBurned } = useAmountActivity(poolDetail);

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const estimatedRewardNum = useMemo(() => {
        if (!poolDetail) return "-";
        if (!poolDetail?.userAmount)
            return "0";
        const amount =
            Number(poolDetail.userAmount) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        if (isNaN(amount)) return "0";
        const reward =
            (amount / (Number(poolDetail.depositedAmount) || 1)) *
            (Number(poolDetail.pool.rewardAmount) /
                Math.pow(10, poolDetail.pool.rewardTokenDecimals));
        return shortenNumber({ number: reward }) ?? "0";
    }, [poolDetail]);

    return (
        <>
            <StatRow
                label="Your Burned Amount"
                value={
                    <div className="inline-flex items-center gap-1 md:gap-1.5">
                        {formattedBurned}
                        <TokenDisplay
                            symbol={poolDetail?.tokenIn?.symbol}
                            customSymbol={poolDetail?.tokenIn?.customSymbol}
                            imageUri={burnTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-3.5 md:size-4 2xl:size-4.25",
                                container: "inline-flex items-center gap-1 md:gap-1.5",
                            }}
                        />
                    </div>
                }
                className="text-burn-border/85"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow
                label="Estimated Claimable Reward"
                value={
                    <div className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {estimatedRewardNum}
                        <TokenDisplay
                            symbol={poolDetail?.tokenOut?.symbol}
                            customSymbol={poolDetail?.tokenOut?.customSymbol}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </div>
                }
            />
            <StatRow
                label="Fee"
                value={
                    <div className="inline-flex items-center gap-1 md:gap-1.5">
                        {formatAmount(
                            poolDetail?.userAmount?.totalSettlementFee ?? "0",
                            poolDetail?.pool.rewardTokenDecimals ?? 0,
                        )}
                        <TokenDisplay
                            symbol={poolDetail?.tokenOut?.symbol}
                            customSymbol={poolDetail?.tokenOut?.customSymbol}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-3.5 md:size-4 2xl:size-4.25",
                                container: "inline-flex items-center gap-1 md:gap-1.5",
                            }}
                        />
                    </div>
                }
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
