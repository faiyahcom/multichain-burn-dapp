import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import { formatAmount } from "@/utils/helpers/numbers";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const PoolOverview = ({ poolDetail }: Props) => {
  const network = poolDetail?.pool?.chainId
    ? chainIdToNetworkConfig(poolDetail.pool.chainId)
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const launchpadPool = poolDetail?.pool as any;

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

    const isInstant = launchpadPool?.isInstant as boolean | undefined;
    const isAuto = launchpadPool?.isAuto as boolean | undefined;

    const claimPolicy = isInstant
      ? "Instant"
      : isInstant === false
        ? "After End"
        : "-";

    const distributionMode =
      isInstant === false
        ? isAuto
          ? "Auto Distribution"
          : isAuto === false
            ? "Claim Mode"
            : "-"
        : null;

    const startTime = formatTimestampSecondsToDate({
      timestamp: poolDetail.pool.timeStart,
      formatStr: "dd/MM/yyyy HH:mm",
    });

    const endTime = formatTimestampSecondsToDate({
      timestamp: poolDetail.pool.timeEnd,
      formatStr: "dd/MM/yyyy HH:mm",
    });

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
      [
        { label: "Start Time", value: startTime },
        { label: "End Time", value: endTime },
      ],
    ];

    if (isDynamic && launchpadPool?.showReward !== undefined) {
      base.push([
        {
          label: "Reward Visibility",
          value: launchpadPool.showReward ? "ON" : "OFF",
        },
      ]);
    }

    return base;
  }, [poolDetail, network, saleTokenDisplay, paymentTokenDisplay, launchpadPool]);

  return (
    <div className="mt-3 w-full py-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1.5 w-1.5 bg-black" />
        <span className="text-xl font-medium">Pool Overview</span>
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
                <div
                  key={ci}
                  className="grid grid-cols-2 items-center gap-y-1 text-sm"
                >
                  <span className="text-greyed">{cell.label}</span>
                  <span className="text-right sm:text-left">{cell.value}</span>
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
