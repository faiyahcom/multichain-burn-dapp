import { useMemo } from "react";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import Decimal from "decimal.js";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail.pool.rewardAmount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";
    const formattedBurned = poolDetail
        ? formatAmount(poolDetail.depositedAmount, poolDetail.pool.tokenInDecimals)
        : "-";
    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
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

        const num = new Decimal(poolDetail.pool.rewardNumerator ?? 0); // N
        const den = new Decimal(poolDetail.pool.rewardDenominator ?? 0); // D

        if (num.isZero() || den.isZero()) return new Decimal(0);

        // Raw reward amount (in base units)
        const rewardRaw = new Decimal(poolDetail.rewardAmount ?? 0);
        const rewardDecimals = poolDetail.pool.rewardTokenDecimals;

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
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-14 pb-4 text-xl font-medium">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span>Reward Amount</span>
                </div>
                <p>
                    {formattedReward} {rewardTokenDisplay?.symbol}
                </p>
            </div>
            <div>
                <p className="text-base text-greyed">
                    <span>Total Burned Amount:</span>{" "}
                    <span className="ml-14">
                        {formattedBurned} / {formattedMaxBurn} {burnTokenDisplay?.symbol}
                    </span>
                </p>
                <div>
                    <div className="h-3.25 w-full rounded-[9.5px] bg-progress-bg">
                        <div
                            className="h-full rounded-[9.5px] bg-progress"
                            style={{ width: `${burnProgress * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardAmount;
