import { useMemo } from "react";
import { NETWORK_CONFIGS } from "@/config/networks";
import type { PoolDetailResponse } from "@/services/poolService";

type Props = {
    poolDetail?: PoolDetailResponse;
};

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

function toCleanRatio(numerator?: string, denominator?: string): string {
    if (!numerator || !denominator) return "—";

    const num = Number(numerator);
    const den = Number(denominator);

    if (!num || !den) return "—";

    const divisor = gcd(num, den);
    return `${num / divisor}:${den / divisor}`;
}

export function trimAddress(address?: string, head = 4, tail = 4): string {
    if (!address) return "—";
    if (address.length <= head + tail) return address;
    return `${address.slice(0, head)}...${address.slice(-tail)}`;
}

const PoolOverview = ({ poolDetail }: Props) => {
    const rows = useMemo(() => {
        if (!poolDetail) return [];

        const cleanRatio = toCleanRatio(
            poolDetail.pool.rewardNumerator,
            poolDetail.pool.rewardDenominator,
        );

        const network =
            NETWORK_CONFIGS.find(
                (n) => n.appKitNetwork.id.toString() === poolDetail.pool.chainId,
            )?.label || "Unknown Network";

        return [
            [
                { label: "Pool Type", value: "Swap Pool" },
                { label: "Network", value: network },
            ],
            [
                { label: "Ratio", value: cleanRatio },
                {
                    label: "Burn Token",
                    value: trimAddress(poolDetail.pool.burnToken),
                },
            ],
            [
                { label: "Burn Method", value: "Transfer to Maker" },
                {
                    label: "Reward Token",
                    value: trimAddress(poolDetail.pool.rewardToken),
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
                            <span className="text-xl break-all text-black">{row[0].value}</span>
                        </div>
                        <div className="grid grid-cols-2">
                            <span className="text-xl text-greyed">{row[1].label}:</span>
                            <span className="text-xl break-all text-black">{row[1].value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PoolOverview;
