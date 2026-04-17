import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import GlowContainer from "@/components/common/glow/container";
import InfoTooltip from "@/components/common/glow/info-tooltip";

type Props = {
  poolDetail?: PoolDetailResponse;
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function toCleanRatio(numerator?: string, denominator?: string): string {
  if (!numerator || !denominator) return "—";

  const num = Number(numerator);
  const den = Number(denominator);

  if (!num || !den) return "—";

  const divisor = gcd(num, den);
  return `${num / divisor}:${den / divisor}`;
}

const PoolOverview = ({ poolDetail }: Props) => {
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
  const rows = useMemo(() => {
    if (!poolDetail) return [];

    const cleanRatio = toCleanRatio(
      poolDetail?.pool?.rewardDenominator,
      poolDetail?.pool?.rewardNumerator, // It's reward num and dem, not ratio on onchain
    );

    return [
      [
        { label: "Pool Type", value: "Swap Pool" },
        {
          label: "Network",
          value: (
            <div className="flex items-center gap-2">
              <NetworkIcon networkId={network?.id || ("" as NetworkId)} className="size-4 md:size-5 2xl:size-6" />
              <span>{network?.label}</span>
            </div>
          ),
        },
      ],
      [
        {
          label: (
            <div className="flex items-center gap-1">
              <span>Ratio</span>
              <InfoTooltip
                side="right"
                content="Token swap : token reward"
                variant="swap"
                classNames={{
                  icon: "size-3.5 text-xs",
                  contentContainer: "max-h-fit",
                  textContainer: "min-h-10 font-inter",
                }}
              />
            </div>
          ),
          value: cleanRatio,
        },
        {
          label: "Swap Token",
          // value: `${poolDetail?.pool?.tokenInSymbol}`,
          value: (
            <div className="flex items-center gap-2">
              <TokenImage
                src={burnTokenDisplay.imageUri}
                alt={burnTokenDisplay.name}
                classNames={{
                  common: "size-4 md:size-5 2xl:size-6",
                  img: "size-4 md:size-5 2xl:size-6",
                  placeholder: "size-4 md:size-5 2xl:size-6",
                }}
              />
              <span>{burnTokenDisplay.symbol}</span>
            </div>
          ),
        },
      ],
      [
        { label: "Swap Method", value: "Transfer to Maker" },
        {
          label: "Reward Token",
          value: (
            <div className="flex items-center gap-2">
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
  }, [burnTokenDisplay, network, poolDetail, rewardTokenDisplay]);

  return (
    <GlowContainer
      variant="swap"
      className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
    >
      <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">Pool Overview</p>

      {!poolDetail && !rows.length ? (
        <div className="space-y-2">
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
            <div className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:space-x-2" key={rowIndex}>
              <div className="grid grid-cols-2">
                <span className="inline-flex items-center gap-1 text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                  {row[0].label}:
                </span>
                <span className="text-sm break-all md:text-base lg:text-xl 2xl:text-2xl">{row[0].value}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                  {row[1].label}:
                </span>
                <span className="text-sm font-medium break-all md:text-base lg:text-xl 2xl:text-2xl">
                  {row[1].value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlowContainer>
  );
};

export default PoolOverview;
