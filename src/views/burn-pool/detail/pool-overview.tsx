import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import NetworkIcon from "@/components/layout/header/network-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import GlowContainer from "@/components/common/glow/container";

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

    // if (poolDetail?.pool?.status === "ended") {
    //     return [
    //         [
    //             { label: "Ratio", value: "Dynamic" },
    //             {
    //                 label: "Burn Token",
    //                 // value: `${poolDetail.pool.tokenInSymbol}`,
    //                 value: (
    //                     <div className="flex items-center gap-2">
    //                         <TokenImage
    //                             src={burnTokenDisplay.imageUri}
    //                             alt={burnTokenDisplay.name}
    //                             classNames={{
    //                                 common: "size-6",
    //                                 img: "size-6",
    //                                 placeholder: "size-6",
    //                             }}
    //                         />
    //                         <span>{burnTokenDisplay.symbol}</span>
    //                     </div>
    //                 ),
    //             },
    //         ],
    //         [
    //             { label: "Burn Method", value: "Burn" },
    //             {
    //                 label: "Reward Token",
    //                 value: (
    //                     <div className="flex items-center gap-2">
    //                         <TokenImage
    //                             src={rewardTokenDisplay.imageUri}
    //                             alt={rewardTokenDisplay.name}
    //                             classNames={{
    //                                 common: "size-6",
    //                                 img: "size-6",
    //                                 placeholder: "size-6",
    //                             }}
    //                         />
    //                         <span>{rewardTokenDisplay.symbol}</span>
    //                     </div>
    //                 ),
    //             },
    //         ],
    //     ];
    // }

    return [
      [
        { label: "Pool Type", value: "Burn Pool" },
        {
          label: "Network",
          value: (
            <div className="flex items-center gap-2">
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
        { label: "Burn Method", value: "Burn" },
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
      variant="burn"
      className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <p className="font-orbitron text-base font-semibold md:text-xl lg:text-2xl 2xl:text-28px">
          Pool Overview
        </p>
        <p className="text-[13px] text-mb-gray-b8 md:text-md 2xl:text-xl">
          {poolDetail?.pool?.timeStart && poolDetail?.pool?.timeEnd
            ? `${new Date(Number(poolDetail.pool.timeStart) * 1000).toLocaleDateString()} - ${new Date(
              Number(poolDetail.pool.timeEnd) * 1000,
            ).toLocaleDateString()}`
            : "No time limit"}
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div
            className="grid grid-cols-1 gap-y-1 md:grid-cols-2 md:space-x-2"
            key={rowIndex}
          >
            <div className="grid grid-cols-2">
              <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                {row[0]?.label}:
              </span>
              <span className="text-sm break-all md:text-base lg:text-xl 2xl:text-2xl">
                {row[0].value}
              </span>
            </div>
            {row[1] && (
              <div className="grid grid-cols-2">
                <span className="text-sm text-mb-gray-b8 md:text-base lg:text-xl 2xl:text-2xl">
                  {row[1]?.label}:
                </span>
                <span className="text-sm font-medium break-all md:text-base lg:text-xl 2xl:text-2xl">
                  {row[1]?.value}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </GlowContainer>
  );
};

export default PoolOverview;
