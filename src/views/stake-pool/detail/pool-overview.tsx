import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import GlowContainer from "@/components/common/glow/container";
import CopyableText from "@/components/common/copyable-text";
import { truncateString } from "@/utils/helpers/string";
import { formatDuration } from "@/utils/helpers/timer";
import Decimal from "decimal.js";
import { formatAmount, safeDecimal, shortenNumber } from "@/utils/helpers/numbers";
import { DECIMAL_FEE_PERCENT } from "@/views/admin/fee-settings-management/hooks/useFeeSettings";
import { cn } from "@/lib/utils";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const formatApr = (apr?: string): string => {
    if (!apr) return "—";
    // APR is in basis points: 1000 = 10%
    return `${shortenNumber({ number: Number(apr) / DECIMAL_FEE_PERCENT, decimalPlaces: 2 })}%`;
};

const PoolOverview = ({ poolDetail }: Props) => {
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

    const pool = poolDetail?.pool;
    const stakePool = pool as any;

    const isSameToken = !!(
        pool?.rewardToken &&
        pool?.tokenIn &&
        pool.rewardToken.toLowerCase() === pool.tokenIn.toLowerCase()
    );

    const fmtStakingAmt = (raw: string | null | undefined) => {
        if (!raw || raw === "0" || pool?.tokenInDecimals == null)
            return "Unlimited";
        return `${formatAmount(raw, pool.tokenInDecimals)} ${stakingTokenDisplay.symbol}`;
    };

    const remainingCapacity = useMemo(() => {
        if (
            !stakePool?.stakingLimit ||
            stakePool.stakingLimit === "0" ||
            pool?.tokenInDecimals == null
        )
            return "Unlimited";
        try {
            const limit = safeDecimal(stakePool.stakingLimit);
            const staked = safeDecimal(poolDetail?.staking?.totalStaked);
            const remaining = limit.sub(staked);
            return `${formatAmount(Decimal.max(0, remaining).toFixed(0, Decimal.ROUND_DOWN), pool.tokenInDecimals)} ${stakingTokenDisplay.symbol}`;
        } catch {
            return "—";
        }
    }, [
        stakePool?.stakingLimit,
        pool?.tokenInDecimals,
        poolDetail?.staking?.totalStaked,
        stakingTokenDisplay.symbol,
    ]);

    const rows = useMemo(() => {
        if (!poolDetail) return [];

        return [
            [
                {
                    label: "Owner Address",
                    value: pool?.owner ? (
                        <CopyableText
                            content={pool.owner}
                            displayText={
                                truncateString({ str: pool.owner, left: 6, right: 4 }) || "—"
                            }
                            classNames={{
                                container: "justify-end text-right",
                                displayText:
                                    "text-foreground font-inter text-sm md:text-base lg:text-xl 2xl:text-2xl",
                            }}
                        />
                    ) : (
                        "—"
                    ),
                },
                {
                    label: "Lock-up Duration",
                    value:
                        stakePool?.lockUpDuration !== undefined
                            ? formatDuration(stakePool.lockUpDuration)
                            : "—",
                },
            ],
            [
                { label: "Pool Type", value: "Staking Pool" },
                {
                    label: "Interest Start Delay",
                    value:
                        (stakePool?.interestStartDelay ??
                            stakePool?.interestStrartDelay) !== undefined
                            ? formatDuration(
                                stakePool.interestStartDelay ?? stakePool.interestStrartDelay,
                            )
                            : "—",
                },
            ],
            [
                {
                    label: "Min Staking Limit",
                    value: fmtStakingAmt(stakePool?.minStakingAmount),
                },
                {
                    label: "Interest Accrual Duration",
                    value:
                        stakePool?.interestAccrualDuration !== undefined
                            ? stakePool.interestAccrualDuration === "0"
                                ? "Unlimited"
                                : formatDuration(stakePool.interestAccrualDuration)
                            : "—",
                },
            ],
            [
                {
                    label: "Max Staking Limit",
                    value: fmtStakingAmt(stakePool?.maxStakingAmount),
                },
                {
                    label: "Claim Start Delay",
                    value:
                        stakePool?.claimStartDelay !== undefined
                            ? formatDuration(stakePool.claimStartDelay)
                            : "—",
                },
            ],
            [
                { label: "Pool Limit", value: fmtStakingAmt(stakePool?.stakingLimit) },
                {
                    label: "Network",
                    value: (
                        <div className="flex h-fit items-center gap-2">
                            <NetworkIcon
                                networkId={network?.id || ("" as NetworkId)}
                                className="size-4 md:size-5 2xl:size-6"
                            />
                            <span>{network?.label}</span>
                        </div>
                    ),
                },
            ],
            [
                { label: "Remaining Capacity", value: remainingCapacity },
                {
                    label: "Staking Token",
                    value: (
                        <div className="flex h-fit items-center gap-2">
                            <TokenImage
                                src={stakingTokenDisplay.imageUri}
                                alt={stakingTokenDisplay.name}
                                classNames={{
                                    common: "size-4 md:size-5 2xl:size-6",
                                    img: "size-4 md:size-5 2xl:size-6",
                                    placeholder: "size-4 md:size-5 2xl:size-6",
                                }}
                            />
                            <span>{stakingTokenDisplay.symbol}</span>
                        </div>
                    ),
                },
            ],
            [
                {
                    label: "APR",
                    value: formatApr(pool?.apr),
                },
                isSameToken
                    ? {
                        label: "Interest generated by the APR",
                        value: null,
                    }
                    : {
                        label: "Reward Token",
                        value: (
                            <div className="flex h-fit items-center gap-2">
                                <TokenImage
                                    src={rewardTokenDisplay.imageUri}
                                    alt={rewardTokenDisplay.name}
                                    classNames={{
                                        common: "size-4 md:size-5 2xl:size-6",
                                        img: "size-4 md:size-5 2xl:size-6",
                                        placeholder: "size-4 md:size-5 2xl:size-6",
                                    }}
                                />
                                <span>{rewardTokenDisplay.symbol}</span>
                            </div>
                        ),
                    },
            ],
        ];
    }, [
        network,
        poolDetail,
        pool,
        stakePool,
        isSameToken,
        rewardTokenDisplay,
        stakingTokenDisplay,
        fmtStakingAmt,
        remainingCapacity,
    ]);

    return (
        <GlowContainer
            variant="stake"
            className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
        >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Pool Overview
                </p>
                <p className="text-[13px] text-mb-gray-b8 md:text-md 2xl:text-xl">
                    {poolDetail?.pool?.timeStart && poolDetail?.pool?.timeEnd
                        ? `${new Date(Number(poolDetail.pool.timeStart) * 1000).toLocaleDateString()} — ${new Date(
                            Number(poolDetail.pool.timeEnd) * 1000,
                        ).toLocaleDateString()}`
                        : "No time limit"}
                </p>
            </div>

            <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                    <div
                        className="grid grid-cols-1 space-x-2 gap-y-1 md:grid-cols-2 md:space-x-6 2xl:space-x-8"
                        key={rowIndex}
                    >
                        <div className="grid grid-cols-2">
                            <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                                {row[0]?.label}:
                            </span>
                            <span className="flex justify-end text-sm md:text-base lg:text-xl 2xl:text-2xl">
                                {row[0]?.value}
                            </span>
                        </div>
                        {row[1] && (
                            <div
                                className={cn("grid grid-cols-2", {
                                    "grid-cols-1": row[1]?.value === null,
                                })}
                            >
                                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                                    {row[1]?.label}
                                    {row[1]?.value !== null ? ":" : ""}
                                </span>
                                {row[1]?.value !== null && (
                                    <span className="flex justify-end text-sm font-medium md:text-base lg:text-xl 2xl:text-2xl">
                                        {row[1]?.value}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </GlowContainer>
    );
};

export default PoolOverview;
