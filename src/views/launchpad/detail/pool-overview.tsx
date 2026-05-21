import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import GlowContainer from "@/components/common/glow/container";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import { safeDecimal, shortenNumber } from "@/utils/helpers/numbers";
import { cn } from "@/lib/utils";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PoolOverview = ({ poolDetail }: Props) => {
    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const pool = poolDetail?.pool;

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

    const priceDisplay = useMemo(() => {
        if (isDynamic) return "Dynamic";
        try {
            const denominator = safeDecimal(pool?.rewardDenominator);
            const numerator = safeDecimal(pool?.rewardNumerator);
            if (numerator.isZero()) return "Dynamic";
            const price = denominator.div(numerator);
            return shortenNumber({ number: price.toNumber() });
        } catch {
            return "Dynamic";
        }
    }, [
        isDynamic,
        pool?.rewardDenominator,
        pool?.rewardNumerator,
        paymentTokenDisplay.symbol,
        saleTokenDisplay.symbol,
    ]);

    const claimPolicyStr = poolDetail?.pool?.claimPolicy;
    const distributionModeStr = poolDetail?.pool?.distributionMode;

    const claimPolicy =
        claimPolicyStr === "instant"
            ? "Instant"
            : claimPolicyStr === "after_end"
                ? "After End"
                : "-";

    const distributionMode =
        claimPolicyStr === "after_end"
            ? distributionModeStr === "automatic"
                ? "Auto Distribution"
                : distributionModeStr === "claim"
                    ? "Claim Mode"
                    : "-"
            : null;

    const modeLabel = useMemo(() => {
        if (!pool?.rewardDenominator) return "—";
        return Number(pool.rewardDenominator) === 0 ? "Dynamic" : "Fixed";
    }, [pool?.rewardDenominator]);

    const rows = useMemo(
        () => [
            [
                { label: "Pool Type", value: "Launchpad" },
                { label: "Mode", value: modeLabel },
            ],
            [
                { label: "Price", value: priceDisplay },
                { label: "Claim Policy", value: claimPolicy },
            ],
            [
                {
                    label: "Network",
                    value: (
                        <div className="flex h-fit items-center gap-2">
                            <NetworkIcon
                                networkId={network?.id || ("" as NetworkId)}
                                className="size-4 md:size-5 2xl:size-6"
                            />
                            <span>{network?.label ?? pool?.chainId ?? "—"}</span>
                        </div>
                    ),
                },
                {
                    label: "Sale Token",
                    value: (
                        <div className="flex h-fit items-center gap-2">
                            <TokenImage
                                src={saleTokenDisplay.imageUri}
                                alt={saleTokenDisplay.name}
                                classNames={{
                                    common: "size-4 md:size-5 2xl:size-6",
                                    img: "size-4 md:size-5 2xl:size-6",
                                    placeholder: "size-4 md:size-5 2xl:size-6",
                                }}
                            />
                            <span>{saleTokenDisplay.symbol}</span>
                        </div>
                    ),
                },
            ],
            [
                {
                    label: "Payment Token",
                    value: (
                        <div className="flex h-fit items-center gap-2">
                            <TokenImage
                                src={paymentTokenDisplay.imageUri}
                                alt={paymentTokenDisplay.name}
                                classNames={{
                                    common: "size-4 md:size-5 2xl:size-6",
                                    img: "size-4 md:size-5 2xl:size-6",
                                    placeholder: "size-4 md:size-5 2xl:size-6",
                                }}
                            />
                            <span>{paymentTokenDisplay.symbol}</span>
                        </div>
                    ),
                },
                distributionMode && { label: "Distribution Mode", value: distributionMode },
            ],
        ],
        [
            modeLabel,
            priceDisplay,
            claimPolicy,
            distributionMode,
            pool?.timeStart,
            pool?.timeEnd,
            pool?.chainId,
            network,
            saleTokenDisplay,
            paymentTokenDisplay,
        ],
    );

    if (!poolDetail) return null;

    return (
        <GlowContainer
            variant="launchpad"
            className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
        >
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
                    Pool Overview
                </p>
                <p className="text-13px text-mb-gray-b8 md:text-md 2xl:text-xl">
                    {poolDetail?.pool?.timeStart && poolDetail?.pool?.timeEnd
                        ? `${formatTimestampSecondsToDate({
                            timestamp: poolDetail.pool.timeStart,
                        })} — ${formatTimestampSecondsToDate({
                            timestamp: poolDetail.pool.timeEnd,
                        })}`
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
                            <span className="flex justify-end text-right text-sm md:text-base lg:text-xl 2xl:text-2xl">
                                {row[0]?.value}
                            </span>
                        </div>
                        {row[1] ? (
                            <div className={cn("grid grid-cols-2")}>
                                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                                    {row[1]?.label}:
                                </span>
                                <span className="flex justify-end text-right text-sm font-medium md:text-base lg:text-xl 2xl:text-2xl">
                                    {row[1]?.value}
                                </span>
                            </div>
                        ) : (
                            <div />
                        )}
                    </div>
                ))}
            </div>
        </GlowContainer>
    );
};

export default PoolOverview;
