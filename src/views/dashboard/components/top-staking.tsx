import GlowContainer from "@/components/common/glow/container";
import {
    IconStakeCategory,
    IconStakeComingSoon,
    IconTop1,
    IconTop2,
    IconTop3,
} from "@/assets/react";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/utils/helpers/string";
import TopStakingBgImage from "/images/dashboard/top-staking-bg.png";

// Stable timestamps computed once at module-load time so countdown ticks naturally
const NOW = Math.floor(Date.now() / 1000);

type StaticStakePool = {
    id: string;
    rankIcon: React.ReactNode;
    name: string;
    amount: string;
    symbol: string;
    imageUri: string;
    status: "live" | "upcoming";
    timeEnd?: number;
    daysUntil?: number;
};

const HARDCODED_POOLS: StaticStakePool[] = [
    {
        id: "1",
        rankIcon: <IconTop1 className="size-4" />,
        name: "YUNANa",
        amount: "1,250,000",
        symbol: "YUNANa",
        imageUri: "",
        status: "live",
        timeEnd: NOW + 48 * 3600 + 25 * 60 + 14,
    },
    {
        id: "2",
        rankIcon: <IconTop2 className="size-4" />,
        name: "HAHA",
        amount: "",
        symbol: "HAHA",
        imageUri: "",
        status: "upcoming",
        daysUntil: 3,
    },
    {
        id: "3",
        rankIcon: <IconTop3 className="size-4" />,
        name: "YUNANa",
        amount: "1,250,000",
        symbol: "YUNANa",
        imageUri: "",
        status: "live",
        timeEnd: NOW + 48 * 3600 + 25 * 60 + 14,
    },
];

// ── Pool card ──────────────────────────────────────────────────────────────────

const LiveStatus = ({ timeEnd }: { timeEnd: number }) => {
    const remaining = useCountdown(timeEnd);
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                Live {formatCountdown(remaining)}
            </span>
            <span className="text-xs font-semibold sm:text-tiny 2xl:text-xs">
                JOIN
            </span>
        </div>
    );
};

const StakePoolCard = ({ pool }: { pool: StaticStakePool }) => (
    <GlowContainer
        variant="stake"
        className="relative flex aspect-square cursor-pointer flex-col items-center justify-around"
    >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <img
                src={TopStakingBgImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="bg-mb-stake-overlay/72 absolute inset-0" />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between gap-1 p-1.5 text-center font-inter sm:gap-0 sm:px-1 sm:py-1.5 2xl:gap-1 2xl:px-2 2xl:py-2">
            {/* Rank + name */}
            <div className="relative flex w-full items-center justify-center">
                <div className="absolute left-1">{pool.rankIcon}</div>
                <p className="text-xs font-semibold sm:text-tiny 2xl:text-xs">
                    {pool.name}
                </p>
            </div>

            {/* Amount */}
            {pool.amount && (
                <p className="text-2xl font-semibold sm:text-sm 2xl:text-lg">
                    {pool.amount}
                </p>
            )}

            {/* Token icon placeholder */}
            <div className="flex size-8.5 items-center justify-center rounded-full bg-mb-btn-stake/50 lg:size-7 2xl:size-11">
                <span className="text-[9px] leading-none font-bold">
                    {pool.symbol.slice(0, 2).toUpperCase()}
                </span>
            </div>

            {/* Status */}
            {pool.status === "live" && pool.timeEnd && (
                <LiveStatus timeEnd={pool.timeEnd} />
            )}
            {pool.status === "upcoming" && (
                <div className="flex flex-col items-center gap-px">
                    <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                        Upcoming
                    </span>
                    <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                        {pool.daysUntil} day{pool.daysUntil !== 1 ? "s" : ""}
                    </span>
                </div>
            )}
        </div>
    </GlowContainer>
);

const ComingSoonCard = () => (
    <GlowContainer
        variant="stake"
        className="relative flex aspect-square flex-col items-center justify-center"
    >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <img
                src={TopStakingBgImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="bg-mb-stake-overlay/72 absolute inset-0" />
        </div>
        <IconStakeComingSoon className="absolute top-1/2 left-1/2 size-18 -translate-x-1/2 -translate-y-1/2 transform opacity-60 sm:size-9 2xl:size-18" />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform font-inter text-[15px] font-medium text-nowrap sm:text-tiny 2xl:text-[15px]">
            Coming soon
        </p>
    </GlowContainer>
);

// ── Top Staking Pools section ──────────────────────────────────────────────────

export const TopStakingPools = () => (
    <GlowContainer className="px-5 py-6.25" variant="stake">
        <div className="mb-6 flex items-center gap-3">
            <IconStakeCategory className="size-10.75" />
            <p className="text-2xl font-medium text-nowrap">TOP STAKING POOLS</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => {
                const pool = HARDCODED_POOLS[i];
                return pool ? (
                    <StakePoolCard key={pool.id} pool={pool} />
                ) : (
                    <ComingSoonCard key={i} />
                );
            })}
        </div>
    </GlowContainer>
);
