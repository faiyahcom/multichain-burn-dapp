import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/common/glow/button";
import { IconExclaimation } from "@/assets/react";
import { formatAmount } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenDisplay from "@/components/common/token-display";
import { StatRow } from "@/views/burn-pool/detail/amount-activities/components";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
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

    const ua = poolDetail?.staking?.user;
    const tokenInDecimals = poolDetail?.pool?.tokenInDecimals ?? 18;
    const rewardDecimals = poolDetail?.pool?.rewardTokenDecimals ?? 18;

    const fmtStaking = (val?: string) =>
        val ? formatAmount(val, tokenInDecimals) : "0";
    const fmtReward = (val?: string) =>
        val ? formatAmount(val, rewardDecimals) : "0";

    const stakingToken = (
        <TokenDisplay
            symbol={stakingTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={stakingTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    const rewardToken = (
        <TokenDisplay
            symbol={rewardTokenDisplay.symbol}
            customSymbol={undefined}
            imageUri={rewardTokenDisplay.imageUri ?? undefined}
            classNames={{
                img: "size-3.5 md:size-4",
                container: "inline-flex items-center gap-1",
            }}
        />
    );

    return (
        <>
            <StatRow
                label="Your Total Staked"
                value={
                    <span className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {fmtStaking(ua?.totalStaked)}
                        <TokenDisplay
                            symbol={stakingTokenDisplay.symbol}
                            customSymbol={undefined}
                            imageUri={stakingTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </span>
                }
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow
                label="Available to Unstake"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtStaking(ua?.availableUnstake)} {stakingToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Total Unstaked"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtStaking(ua?.totalUnstaked)} {stakingToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Reward Accrued"
                value={
                    <span className="inline-flex items-center gap-1.5 md:gap-2.5">
                        {fmtReward(ua?.rewardAccrued)}
                        <TokenDisplay
                            symbol={rewardTokenDisplay.symbol}
                            customSymbol={undefined}
                            imageUri={rewardTokenDisplay.imageUri ?? undefined}
                            classNames={{
                                img: "size-4 md:size-5 2xl:size-5.75",
                                container: "inline-flex items-center gap-1.5 md:gap-2.5",
                            }}
                        />
                    </span>
                }
                className="text-mb-btn-stake"
                labelClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl"
                valueClassName="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold"
            />
            <StatRow
                label="Claimable"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.availableClaim)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Your Reward Claimed"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.totalClaimed)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />
            <StatRow
                label="Total Fee"
                value={
                    <span className="inline-flex items-center gap-1">
                        {fmtReward(ua?.totalSettlementFee)} {rewardToken}
                    </span>
                }
                className="ml-4"
            />
            <p className="text-center text-sm md:text-base lg:text-lg 2xl:text-xl">
                Interest stops accruing upon unstaking.
            </p>
            {/* Emergency closed warning */}
            <div className="inline-flex items-start gap-1">
                <IconExclaimation className="inline size-5" />
                <span className="text-sm text-mb-gray-b8">
                    This pool was emergency closed by admin.
                </span>
            </div>
            <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Stake
            </Button>
            {/* <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Claim Reward
            </Button>
            <Button
                variant="stake"
                className="my-1.5 w-full py-2 font-orbitron text-base md:my-3 md:py-3 md:text-lg lg:text-xl 2xl:text-2xl"
                disabled
            >
                Unstake &amp; Claim
            </Button> */}
        </>
    );
};

export default ClosedStatus;
