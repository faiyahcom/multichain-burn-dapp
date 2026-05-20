import { useMemo } from "react";
import Decimal from "decimal.js";
import {
    formatAmount,
    safeDecimal,
    shortenNumber,
} from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import GlowContainer from "@/components/common/glow/container";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const pool = poolDetail?.pool;
    const network = pool?.chainId
        ? chainIdToNetworkConfig(pool.chainId)
        : undefined;

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

    const settlementFee = pool?.settlementFee
        ? `${shortenNumber({ number: Number(pool.settlementFee) / 100, decimalPlaces: 2 })}%`
        : "—";

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

    // goal raised in payment tokens (human units) — shared by display + progress
    const goalHuman = useMemo(() => {
        if (isDynamic) return null;
        try {
            const rewardAmt = pool?.rewardAmount;
            const rewardDec = pool?.rewardTokenDecimals;
            if (!rewardAmt || rewardDec == null) return null;
            const num = safeDecimal(pool?.rewardNumerator);
            const denom = safeDecimal(pool?.rewardDenominator);
            if (num.isZero()) return null;
            const rewardHuman = safeDecimal(rewardAmt).div(
                new Decimal(10).pow(rewardDec),
            );
            return rewardHuman.mul(denom).div(num);
        } catch {
            return null;
        }
    }, [
        isDynamic,
        pool?.rewardAmount,
        pool?.rewardTokenDecimals,
        pool?.rewardNumerator,
        pool?.rewardDenominator,
    ]);

    // target raised = formatted goalHuman
    const targetRaisedFormatted = useMemo(() => {
        if (!goalHuman) return null;
        return shortenNumber({ number: goalHuman.toNumber() });
    }, [goalHuman]);

    // progress percent 0-100
    const progressPercent = useMemo(() => {
        if (!goalHuman || goalHuman.isZero()) return null;
        try {
            const paymentDec = pool?.tokenInDecimals ?? 0;
            const raisedHuman = safeDecimal(
                poolDetail?.launchpad?.totalRaised ?? "0",
            ).div(new Decimal(10).pow(paymentDec));
            const pct = raisedHuman.div(goalHuman).mul(100).toNumber();
            return Math.min(pct, 100);
        } catch {
            return null;
        }
    }, [goalHuman, poolDetail?.launchpad?.totalRaised, pool?.tokenInDecimals]);

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
                    {totalRewardFormatted} <span>{saleTokenDisplay.symbol}</span>
                </p>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:space-x-8">
                    <p className="flex justify-between text-sm md:text-base lg:text-xl 2xl:text-2xl">
                        <span className="text-mb-gray-b8">Total Raised:</span>
                        <span>
                            {totalRaisedFormatted} <span>{paymentTokenDisplay.symbol}</span>
                        </span>
                    </p>
                    <p className="flex justify-between text-sm md:text-base lg:text-xl 2xl:text-2xl">
                        <span className="text-mb-gray-b8">Settlement Fee:</span>
                        <span>{settlementFee}</span>
                    </p>
                </div>

                {!isDynamic && progressPercent !== null && targetRaisedFormatted && (
                    <div className="space-y-1.5">
                        {/* progress bar */}
                        <p className="flex justify-end text-sm md:text-base lg:text-xl 2xl:text-2xl">
                            <span>
                                {totalRaisedFormatted} / {targetRaisedFormatted}
                            </span>
                            <span>
                                &nbsp;(
                                {shortenNumber({
                                    number:
                                        // handle case almost full because limit 6 decimal after comma input
                                        parseFloat(progressPercent.toFixed(7)) === 99.9999999
                                            ? 100
                                            : parseFloat(progressPercent.toFixed(7)),
                                })}
                                %)
                            </span>
                        </p>
                        <div className="h-4 w-full overflow-hidden rounded-full bg-launchpad-border/40">
                            <div
                                className="h-full rounded-full bg-mb-btn-swap transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </GlowContainer>
    );
};

export default RewardAmount;
