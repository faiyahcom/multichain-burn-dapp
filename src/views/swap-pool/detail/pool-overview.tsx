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
              <NetworkIcon networkId={network?.id || ("" as NetworkId)} />
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
                content="Token burn : token reward"
                variant="swap"
              />
            </div>
          ),
          value: cleanRatio,
        },
        {
          label: "Burn Token",
          // value: `${poolDetail?.pool?.tokenInSymbol}`,
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
        { label: "Burn Method", value: "Transfer to Maker" },
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
    <GlowContainer
      variant="swap"
      className="w-full space-y-6 px-5 py-6 font-inter"
    >
      <p className="font-orbitron text-28px font-semibold">Pool Overview</p>

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
            <div className="grid grid-cols-2 space-x-2" key={rowIndex}>
              <div className="grid grid-cols-2">
                <span className="inline-flex items-center gap-1 text-2xl text-mb-gray-b8">
                  {row[0].label}:
                </span>
                <span className="text-2xl break-all">{row[0].value}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-2xl text-mb-gray-b8">
                  {row[1].label}:
                </span>
                <span className="text-2xl font-medium break-all">
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
