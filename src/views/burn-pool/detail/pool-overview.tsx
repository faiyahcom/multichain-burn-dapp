import { useMemo } from "react";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import { useGetWhitelistTokens } from "@/services/queries/queries";
import NetworkIcon from "@/components/layout/header/network-icon";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PoolOverview = ({ poolDetail }: Props) => {
    const { data: whitelistTokens } =
        useGetWhitelistTokens();
    const burnToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.tokenIn,
    );
    const rewardToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.rewardToken,
    );
    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const rows = useMemo(() => {
        if (!poolDetail) return [];

        return [
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
                            <img
                                src={burnToken?.imageUri}
                                alt={burnToken?.symbol}
                                className="h-6 w-6 rounded-full"
                            />
                            <span>{burnToken?.symbol}</span>
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
                            <img
                                src={rewardToken?.imageUri}
                                alt={rewardToken?.symbol}
                                className="h-6 w-6 rounded-full"
                            />
                            <span>{rewardToken?.symbol}</span>
                        </div>
                    ),
                },
            ],
        ];
    }, [poolDetail]);

    return (
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-2 pb-4">
                <div className="h-1.5 w-1.5 bg-black" />
                <span className="text-xl font-medium">Pool Overview</span>
            </div>

            <div className="space-y-2">
                {rows.map((row, rowIndex) => (
                    <div className="grid grid-cols-2 space-x-2" key={rowIndex}>
                        <div className="grid grid-cols-2">
                            <span className="text-xl text-greyed">{row[0].label}:</span>
                            <span className="text-xl break-all text-black">
                                {row[0].value}
                            </span>
                        </div>
                        <div className="grid grid-cols-2">
                            <span className="text-xl text-greyed">{row[1].label}:</span>
                            <span className="text-xl break-all text-black">
                                {row[1].value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PoolOverview;
