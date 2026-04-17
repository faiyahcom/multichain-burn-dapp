import { useMemo } from "react";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import Decimal from "decimal.js";
import GlowContainer from "@/components/common/glow/container";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail?.pool?.rewardAmount,
            poolDetail?.pool?.rewardTokenDecimals,
        )
        : "-";
    const formattedBurned = poolDetail
        ? formatAmount(
            poolDetail.depositedAmount,
            poolDetail?.pool?.tokenInDecimals,
        )
        : "-";
    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail?.pool?.chainId)
        : undefined;
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const maxBurn = useMemo(() => {
        if (!poolDetail) return new Decimal(0);

        const num = new Decimal(poolDetail?.pool?.rewardNumerator ?? 0); // N
        const den = new Decimal(poolDetail?.pool?.rewardDenominator ?? 0); // D

        if (num.isZero() || den.isZero()) return new Decimal(0);

        // Raw reward amount (in base units)
        const rewardRaw = new Decimal(poolDetail.rewardAmount ?? 0);
        const rewardDecimals = poolDetail?.pool?.rewardTokenDecimals ?? 0;

        // Convert reward to human-readable
        const rewardHuman = rewardRaw.div(new Decimal(10).pow(rewardDecimals));

        // maxBurn in human-readable: rewardHuman * (den / num)
        const maxBurnHuman = rewardHuman.mul(den.div(num));

        return maxBurnHuman;
    }, [poolDetail]);

    const formattedMaxBurn = maxBurn.isZero()
        ? "-"
        : formatAmount(
            maxBurn
                .mul(new Decimal(10).pow(poolDetail!.pool.tokenInDecimals))
                .toFixed(0),
            poolDetail!.pool.tokenInDecimals,
        );

    const burnProgress = maxBurn.isZero()
        ? 0
        : new Decimal(poolDetail?.depositedAmount ?? 0)
            .div(maxBurn.mul(new Decimal(10).pow(poolDetail!.pool.tokenInDecimals)))
            .toNumber();
    return (
        <GlowContainer
            variant="swap"
            className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
        >
            <div className="flex items-center justify-between pr-5 font-orbitron">
                <p className="text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">Reward Amount</p>
                <p className="text-sm font-medium md:text-base lg:text-xl 2xl:text-2xl">
                    {formattedReward} {rewardTokenDisplay?.symbol}
                </p>
            </div>
            <div className="space-y-3.75">
                <p className="flex justify-between pr-2 text-sm md:pr-5 md:text-base lg:text-xl 2xl:text-2xl">
                    <span className="text-mb-gray-b8">
                        Total Swapped Amount:
                    </span>{" "}
                    <span className="">
                        {formattedBurned} / {formattedMaxBurn} {burnTokenDisplay?.symbol}
                    </span>
                </p>
                <div>
                    <div className="h-2.5 w-full overflow-hidden rounded-md border border-swap-border/85 bg-mb-dark-popover-item md:h-3.5 2xl:h-4.5">
                        <div
                            className="h-full rounded-md bg-swap-border/85"
                            style={{ width: `${burnProgress * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </GlowContainer>
    );
};

export default RewardAmount;
