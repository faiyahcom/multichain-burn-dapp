import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { truncateString } from "@/utils/helpers/string";
import CopyableText from "@/components/common/copyable-text";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const PoolOverview = ({ poolDetail }: Props) => {
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
  const rows = useMemo(() => {
    if (!poolDetail) return [];

    return [
      [
        {
          label: "Owner address",
          value: (
            <CopyableText
              classNames={{
                container: "inline-flex items-center gap-2",
                displayText: "text-xl",
              }}
              content={poolDetail?.pool.owner}
              displayText={truncateString({
                str: poolDetail?.pool.owner || "",
              })}
            />
          ),
        },
      ],
      [
        { label: "Pool Type", value: "Burn Pool" },
        {
          label: "Network",
          value: (
            <div className="flex items-center gap-2">
              <NetworkIcon networkId={network?.id || ("" as NetworkId)} />
              <span>{network?.label}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Ratio", value: "Dynamic" },
        {
          label: "Burn Token",
          // value: `${poolDetail.pool.tokenInSymbol}`,
          value: (
            <div className="flex items-center gap-2">
              <TokenImage
                src={burnTokenDisplay.imageUri}
                alt={burnTokenDisplay.name}
                classNames={{
                  common: "size-6",
                  img: "size-6",
                  placeholder: "size-6",
                }}
              />
              <span>{burnTokenDisplay.symbol}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Burn Method", value: "Burn" },
        {
          label: "Reward Token",
          value: (
            <div className="flex items-center gap-2">
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
  }, [burnTokenDisplay, network, poolDetail, rewardTokenDisplay]);

  return (
    <div className="mt-3 w-full py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-black" />
          <span className="text-xl font-medium">Pool Overview</span>
        </div>
        <p className="text-[13px] text-greyed">
          {poolDetail?.pool.timeStart && poolDetail?.pool.timeEnd
            ? `${new Date(Number(poolDetail.pool.timeStart) * 1000).toLocaleDateString()} - ${new Date(
                Number(poolDetail.pool.timeEnd) * 1000,
              ).toLocaleDateString()}`
            : "No time limit"}
        </p>
      </div>

      {!poolDetail && !rows.length ? (
        <div className="space-y-2">
          {/* owner row (full width) */}
          <div className="grid grid-cols-2 space-x-2">
            <div className="grid grid-cols-2 items-center gap-y-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
          {/* 3 regular rows */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="grid grid-cols-2 space-x-2" key={i}>
              <div className="grid grid-cols-2 items-center gap-y-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
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
            <div className="grid grid-cols-2 space-x-2" key={rowIndex}>
              <div className="grid grid-cols-2">
                <span className="text-xl text-greyed">{row[0]?.label}:</span>
                <span className="text-xl break-all text-black">
                  {row[0]?.value}
                </span>
              </div>
              {row[1] && (
                <div className="grid grid-cols-2">
                  <span className="text-xl text-greyed">{row[1]?.label}:</span>
                  <span className="text-xl break-all text-black">
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
