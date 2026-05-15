import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/utils/helpers/numbers";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const PoolOverview = ({ poolDetail }: Props) => {
  const network = poolDetail?.pool?.chainId
    ? chainIdToNetworkConfig(poolDetail.pool.chainId)
    : undefined;

  const saleTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const paymentTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });

  const rows = useMemo(() => {
    if (!poolDetail?.pool) return [];

    // rewardDenominator = on-chain ratioBps, rewardNumerator = on-chain ratioDenominator
    const isDynamic =
      !poolDetail.pool.rewardDenominator ||
      Number(poolDetail.pool.rewardDenominator) === 0;

    const price = isDynamic
      ? "Dynamic"
      : formatAmount(
          String(
            Number(poolDetail.pool.rewardDenominator) /
              Number(poolDetail.pool.rewardNumerator),
          ),
          0,
        );

    const claimPolicyStr = poolDetail.pool.claimPolicy;
    const distributionModeStr = poolDetail.pool.distributionMode;

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

    const tokenImageProps = {
      classNames: { common: "size-6", img: "size-6", placeholder: "size-6" },
    };

    const base = [
      [
        { label: "Pool Type", value: "Launchpad" },
        {
          label: "Network",
          value: (
            <div className="flex items-center gap-2 max-sm:justify-end">
              <NetworkIcon networkId={network?.id || ("" as NetworkId)} />
              <span>{network?.label ?? "-"}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Mode", value: isDynamic ? "Dynamic" : "Fixed" },
        {
          label: "Sale Token",
          value: (
            <div className="flex items-center gap-2 max-sm:justify-end">
              <TokenImage
                src={saleTokenDisplay.imageUri}
                alt={saleTokenDisplay.name}
                {...tokenImageProps}
              />
              <span>{saleTokenDisplay.symbol}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Price", value: isDynamic ? "Dynamic" : price },
        {
          label: "Payment Token",
          value: (
            <div className="flex items-center gap-2 max-sm:justify-end">
              <TokenImage
                src={paymentTokenDisplay.imageUri}
                alt={paymentTokenDisplay.name}
                {...tokenImageProps}
              />
              <span>{paymentTokenDisplay.symbol}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Claim Policy", value: claimPolicy },
        ...(distributionMode !== null
          ? [{ label: "Distribution Mode", value: distributionMode }]
          : [{ label: "Distribution Mode", value: "Instant" }]),
      ],
    ];

    if (isDynamic && poolDetail.pool.rewardVisibility !== undefined) {
      base.push([
        {
          label: "Reward Visibility",
          value: poolDetail.pool.rewardVisibility ? "ON" : "OFF",
        },
      ]);
    }

    return base;
  }, [poolDetail, network, saleTokenDisplay, paymentTokenDisplay]);

  return (
    <div className="mt-3 w-full py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-black" />
          <span className="text-xl font-medium">Pool Overview</span>
        </div>
        <p className="text-[13px] text-greyed">
          {poolDetail?.pool?.timeStart && poolDetail?.pool?.timeEnd
            ? `${formatTimestampSecondsToDate({
                timestamp: poolDetail.pool.timeStart,
                formatStr: "yyyy/MM/dd, HH:mm",
              })} - ${formatTimestampSecondsToDate({
                timestamp: poolDetail.pool.timeEnd,
                formatStr: "yyyy/MM/dd, HH:mm",
              })}`
            : "No time limit"}
        </p>
      </div>

      {!poolDetail ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 space-x-2 sm:grid-cols-2"
            >
              <div className="grid grid-cols-2 items-center gap-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="grid grid-cols-2 items-center gap-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="grid grid-cols-1 space-x-2 sm:grid-cols-2"
            >
              {row.map((cell, ci) => (
                <div key={ci} className="grid grid-cols-2">
                  <span className="text-xl text-greyed">{cell.label}:</span>
                  <span className="text-xl break-all text-black max-sm:text-right">
                    {cell.value}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoolOverview;
