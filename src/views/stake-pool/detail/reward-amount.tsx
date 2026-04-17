import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import GlowContainer from "@/components/common/glow/container";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const RewardAmount = ({ poolDetail }: Props) => {
    const formattedReward =
        poolDetail?.pool?.rewardAmount != null
            ? formatAmount(poolDetail.pool.rewardAmount, poolDetail.pool.rewardTokenDecimals)
            : "-";

    const formattedTotalStaked =
        poolDetail?.staking?.totalStaked != null
            ? formatAmount(poolDetail.staking.totalStaked, poolDetail.pool.tokenInDecimals)
            : "-";

    const settlementFee = poolDetail?.pool?.settlementFee
        ? `${shortenNumber({ number: Number(poolDetail.pool.settlementFee) / 100, decimalPlaces: 2 })}%`
        : "—";

    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
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

    return (
        <GlowContainer
            variant="stake"
            className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
        >
            <div className="flex items-center justify-between font-orbitron">
                <p className="text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Reward Amount
                </p>
                <p className="text-sm font-medium md:text-base lg:text-xl 2xl:text-2xl">
                    {formattedReward}{" "}
                    <span className="text-mb-gray-b8">{rewardTokenDisplay.symbol}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:space-x-8">
                <p className="flex justify-between text-sm md:text-base lg:text-xl 2xl:text-2xl">
                    <span className="text-mb-gray-b8">Total Staked Amount:</span>
                    <span>
                        {formattedTotalStaked}{" "}
                        <span className="text-mb-gray-b8">{stakingTokenDisplay.symbol}</span>
                    </span>
                </p>
                <p className="flex justify-between text-sm md:text-base lg:text-xl 2xl:text-2xl">
                    <span className="text-mb-gray-b8">Settlement Fee:</span>
                    <span>{settlementFee}</span>
                </p>
            </div>
        </GlowContainer>
    );
};

export default RewardAmount;
