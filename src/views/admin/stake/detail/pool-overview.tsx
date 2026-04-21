import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { truncateString } from "@/utils/helpers/string";
import CopyableText from "@/components/common/copyable-text";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "usehooks-ts";
import Decimal from "decimal.js";
import { formatAmount, safeDecimal } from "@/utils/helpers/numbers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

/** Formats a duration in seconds into a human-readable string. */
function formatDuration(seconds: number | bigint | undefined | null): string {
    if (seconds === undefined || seconds === null) return "0 day";
    const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
    if (!isFinite(s) || s <= 0) return "0 day";
    // i64::MAX or very large value → "Infinite"
    if (s >= 9_007_199_254_740_991) return "Infinite";
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    return parts.length ? parts.join(" ") : `${s} seconds`;
}

const PoolOverview = ({ poolDetail }: Props) => {
    const isMobile = useMediaQuery("(max-width: 640px)");
    const pool = poolDetail?.pool;
    const stakePool = pool as any;

    const network = pool?.chainId
        ? chainIdToNetworkConfig(pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const fmtStakingAmt = (raw: string | null | undefined) => {
        if (!raw || raw === "0" || pool?.tokenInDecimals == null)
            return "Unlimited";
        return `${formatAmount(raw, pool.tokenInDecimals)} ${stakingTokenDisplay.symbol}`;
    };

    const remainingCapacity = useMemo(() => {
        if (!pool?.stakingLimit || pool.stakingLimit === "0") return "Unlimited";
        if (pool.tokenInDecimals == null) return "Unlimited";
        try {
            const limit = safeDecimal(pool.stakingLimit);
            const staked = safeDecimal(poolDetail?.staking?.totalStaked);
            const remaining = limit.sub(staked);
            return `${formatAmount(Decimal.max(0, remaining).toFixed(0, Decimal.ROUND_DOWN), pool.tokenInDecimals)} ${stakingTokenDisplay.symbol}`;
        } catch {
            return "Unlimited";
        }
    }, [
        pool?.stakingLimit,
        pool?.tokenInDecimals,
        poolDetail?.staking?.totalStaked,
        stakingTokenDisplay.symbol,
    ]);

    const rows = useMemo(() => {
        if (!poolDetail) return [];

        const aprDisplay =
            stakePool?.apr !== undefined
                ? `${(Number(stakePool.apr) / 100).toFixed(2)}%`
                : "—";

        return [
            [
                {
                    label: isMobile ? "Owner" : "Owner address",
                    value: (
                        <CopyableText
                            classNames={{
                                container: "inline-flex items-center gap-2",
                                displayText: "text-xl",
                            }}
                            content={pool?.owner}
                            displayText={truncateString({ str: pool?.owner || "" })}
                        />
                    ),
                },
                {
                    label: "Interest Accrual Duration",
                    value: !stakePool?.interestAccrualDuration || stakePool?.interestAccrualDuration === "0"
                        ? "Unlimited"
                        : formatDuration(Number(stakePool?.interestAccrualDuration)),
                },
            ],
            [
                { label: "Pool Type", value: "Staking Pool" },
                {
                    label: "Claim Start Delay",
                    value: formatDuration(Number(stakePool?.claimStartDelay)),
                },
            ],
            [
                {
                    label: "Min Staking Amount",
                    value: fmtStakingAmt(stakePool?.minStakingAmount),
                },
                {
                    label: "Max Staking Amount",
                    value: fmtStakingAmt(stakePool?.maxStakingAmount),
                },
            ],
            [
                { label: "Pool Limit", value: fmtStakingAmt(stakePool?.stakingLimit) },
                { label: "Remaining Capacity", value: remainingCapacity },
            ],
            [
                { label: "APR", value: aprDisplay },
                {
                    label: "Network",
                    value: (
                        <div className="flex items-center gap-2 max-sm:justify-end">
                            <NetworkIcon networkId={network?.id || ("" as NetworkId)} />
                            <span>{network?.label}</span>
                        </div>
                    ),
                },
            ],
            [
                {
                    label: "Lock-up Duration",
                    value: formatDuration(Number(stakePool?.lockUpDuration)),
                },
                {
                    label: "Staking Token",
                    value: (
                        <div className="flex items-center gap-2 max-sm:justify-end">
                            <TokenImage
                                src={stakingTokenDisplay.imageUri}
                                alt={stakingTokenDisplay.name}
                                classNames={{
                                    common: "size-6",
                                    img: "size-6",
                                    placeholder: "size-6",
                                }}
                            />
                            <span>{stakingTokenDisplay.symbol}</span>
                        </div>
                    ),
                },
            ],
            [
                {
                    label: "Interest Start Delay",
                    // API field has a typo: "interestStrartDelay"
                    value: formatDuration(Number(stakePool?.interestStartDelay)),
                },
                {
                    label: "Reward Token",
                    value: (
                        <div className="flex items-center gap-2 max-sm:justify-end">
                            <TokenImage
                                src={rewardTokenDisplay.imageUri}
                                alt={rewardTokenDisplay.name}
                                classNames={{
                                    common: "size-6",
                                    img: "size-6",
                                    placeholder: "size-6",
                                }}
                            />
                            <span>{rewardTokenDisplay.symbol}</span>
                        </div>
                    ),
                },
            ],
        ];
    }, [
        poolDetail,
        stakePool,
        network,
        stakingTokenDisplay,
        rewardTokenDisplay,
        isMobile,
        pool?.owner,
        remainingCapacity,
    ]);

    return (
        <div className="mt-3 w-full py-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-black" />
                    <span className="text-xl font-medium">Pool Overview</span>
                </div>
                <p className="text-[13px] text-greyed">
                    {pool?.timeStart && pool?.timeEnd
                        ? `${new Date(Number(pool.timeStart) * 1000).toLocaleDateString()} - ${new Date(Number(pool.timeEnd) * 1000).toLocaleDateString()}`
                        : "No time limit"}
                </p>
            </div>

            {!poolDetail ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2" key={i}>
                            <div className="grid grid-cols-2 items-center gap-y-1">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <div className="grid grid-cols-2 items-center gap-y-1">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((row, rowIndex) => (
                        <div
                            className="grid grid-cols-1 space-x-2 sm:grid-cols-2"
                            key={rowIndex}
                        >
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">{row[0]?.label}:</span>
                                <span className="text-xl break-all text-black max-sm:text-right">
                                    {row[0]?.value}
                                </span>
                            </div>
                            {row[1] && (
                                <div className="grid grid-cols-2">
                                    <span className="text-xl text-greyed">{row[1]?.label}:</span>
                                    <span className="text-xl break-all text-black max-sm:text-right">
                                        {row[1]?.value}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PoolOverview;
