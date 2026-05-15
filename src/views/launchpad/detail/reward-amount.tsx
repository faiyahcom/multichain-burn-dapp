import { useMemo } from "react";
import { formatAmount, safeDecimal } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import GlowContainer from "@/components/common/glow/container";
import { cn } from "@/lib/utils";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const pool = poolDetail?.pool;
    const network = pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined;

    const saleTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const paymentTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const isDynamic = useMemo(() => {
        if (!pool?.rewardDenominator) return true;
        return Number(pool.rewardDenominator) === 0;
    }, [pool?.rewardDenominator]);

    // total reward (the full cap in sale tokens)
    const totalRewardFormatted = useMemo(() => {
        const rewardAmt = pool?.rewardAmount;
        const decimals = pool?.rewardTokenDecimals;
        if (!rewardAmt || decimals == null) return "—";
        return formatAmount(rewardAmt, decimals);
    }, [pool?.rewardAmount, pool?.rewardTokenDecimals]);

    // total raised from launchpad aggregate data
    const totalRaisedFormatted = useMemo(() => {
        const raised = poolDetail?.launchpad?.totalRaised;
        const decimals = pool?.tokenInDecimals;
        if (!raised || decimals == null) return "—";
        return formatAmount(raised, decimals);
    }, [poolDetail?.launchpad?.totalRaised, pool?.tokenInDecimals]);

    // target raised = total reward * (denominator / numerator)
    const targetRaisedFormatted = useMemo(() => {
        if (isDynamic) return null;
        try {
            const rewardAmt = pool?.rewardAmount;
            const decimals = pool?.tokenInDecimals;
            if (!rewardAmt || decimals == null) return null;
            const num = safeDecimal(pool?.rewardNumerator);
            const denom = safeDecimal(pool?.rewardDenominator);
            if (num.isZero()) return null;
            const rewardDecimal = safeDecimal(rewardAmt);
            const target = rewardDecimal.mul(denom).div(num);
            return formatAmount(target.toFixed(0, 1), decimals);
        } catch {
            return null;
        }
    }, [isDynamic, pool?.rewardAmount, pool?.rewardNumerator, pool?.rewardDenominator, pool?.tokenInDecimals]);

    // progress percent 0-100
    const progressPercent = useMemo(() => {
        if (isDynamic || !targetRaisedFormatted) return null;
        try {
            const raised = safeDecimal(poolDetail?.launchpad?.totalRaised ?? "0");
            const num = safeDecimal(pool?.rewardNumerator ?? "1");
            const denom = safeDecimal(pool?.rewardDenominator ?? "1");
            if (num.isZero() || denom.isZero()) return null;
            const rewardAmt = safeDecimal(pool?.rewardAmount ?? "0");
            const target = rewardAmt.mul(denom).div(num);
            if (target.isZero()) return null;
            const pct = raised.div(target).mul(100).toNumber();
            return Math.min(pct, 100);
        } catch {
            return null;
        }
    }, [isDynamic, poolDetail?.launchpad?.totalRaised, pool?.rewardNumerator, pool?.rewardDenominator, pool?.rewardAmount]);

    return (
        <GlowContainer
            variant="launchpad"
            className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
        >
            <div className="flex items-center justify-between font-orbitron">
                <p className="text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Total Reward Pool
                </p>
                <p className="text-sm font-medium md:text-base lg:text-xl 2xl:text-2xl">
                    {totalRewardFormatted}{" "}
                    <span className="text-mb-gray-b8">{saleTokenDisplay.symbol}</span>
                </p>
            </div>

            <div className="space-y-2">
                <p className="flex justify-between text-sm md:text-base lg:text-xl 2xl:text-2xl">
                    <span className="text-mb-gray-b8">Total Raised:</span>
                    <span>
                        {totalRaisedFormatted}{" "}
                        <span className="text-mb-gray-b8">{paymentTokenDisplay.symbol}</span>
                    </span>
                </p>

                {!isDynamic && progressPercent !== null && targetRaisedFormatted && (
                    <div className="space-y-1.5">
                        {/* progress bar */}
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-launchpad-border/40">
                            <div
                                className="h-full rounded-full bg-mb-btn-launchpad transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="flex justify-between text-xs text-mb-gray-b8 md:text-sm lg:text-base">
                            <span>
                                {totalRaisedFormatted} / {targetRaisedFormatted} {paymentTokenDisplay.symbol}
                            </span>
                            <span>{progressPercent.toFixed(1)}%</span>
                        </p>
                    </div>
                )}
            </div>
        </GlowContainer>
    );
};

export default RewardAmount;
