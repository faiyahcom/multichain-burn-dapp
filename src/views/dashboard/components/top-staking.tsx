import GlowContainer from "@/components/common/glow/container";
import {
    IconStakeComingSoon,
    IconTop1,
    IconTop2,
    IconTop3,
} from "@/assets/react";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown } from "@/utils/helpers/string";
import TopStakingBgImage from "/images/dashboard/top-staking-bg.png";
import type { TopStakingPool } from "@/services/dashboardService";
import { shortenNumber } from "@/utils/helpers/numbers";
import TokenDisplay from "@/components/common/token-display";
import { useNavigate } from "@tanstack/react-router";
import StakeCategoryIcon from "@/components/common/glow/icon/stake-category-icon";

const RANK_ICONS = [
    <IconTop1 key="1" className="size-4" />,
    <IconTop2 key="2" className="size-4" />,
    <IconTop3 key="3" className="size-4" />,
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

const StakePoolCard = ({ pool, rank }: { pool: TopStakingPool; rank: number }) => {
    const navigate = useNavigate();
    const timeEnd = Number(pool.timeEnd);
    const status = pool.status;
    const daysUntil = Math.ceil(
        (Number(pool.timeStart) - Math.floor(Date.now() / 1000)) / 86400,
    );
    const stakedDisplay = shortenNumber({ number: pool.stakingAmount });

    return (
        <GlowContainer
            variant="stake"
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-around"
            onClick={() => {
                navigate({
                    to: `/staking/detail/${pool.address}`,
                });
            }}
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
                <div className="relative flex w-full items-center justify-between gap-1 px-1">
                    <div className="w-4 shrink-0">{RANK_ICONS[rank] ?? null}</div>
                    <p className="text-xs font-semibold sm:text-tiny 2xl:text-xs flex-1 truncate min-w-0">
                        {pool.name || pool.tokenInSymbol}
                    </p>
                    <div className="w-4 min-w-0 shrink" />
                </div>

                {/* Staked amount */}
                {pool.stakingAmount > 0 && (
                    <p className="text-2xl font-semibold sm:text-sm 2xl:text-lg">
                        {stakedDisplay}
                    </p>
                )}

                {/* Token icon */}
                <TokenDisplay
                    symbol={pool.tokenInSymbol}
                    customSymbol={undefined}
                    imageUri={pool?.rewardTokenImageUri ?? undefined}
                    classNames={{ img: "size-8.5 lg:size-7 2xl:size-11" }}
                    hasSymbol={false}
                />

                {/* Status */}
                {status === "on_going" && <LiveStatus timeEnd={timeEnd} />}
                {status === "upcoming" && (
                    <div className="flex flex-col items-center gap-px sm:gap-px 2xl:gap-0.5">
                        <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                            Upcoming
                        </span>
                        <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                            {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
                {status !== "on_going" && status !== "upcoming" && (
                    <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                )}
            </div>
        </GlowContainer>
    );
};

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
        <IconStakeComingSoon className="absolute top-1/2 left-1/2 size-18 -translate-x-1/2 -translate-y-1/2 transform opacity-50 sm:size-9 2xl:size-18" />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform font-inter text-[15px] font-medium text-nowrap sm:text-tiny 2xl:text-[15px]">
            Coming soon
        </p>
    </GlowContainer>
);

// ── Top Staking Pools section ──────────────────────────────────────────────────

export const TopStakingPools = ({ pools }: { pools?: TopStakingPool[] }) => (
    <GlowContainer className="px-5 py-6.25" variant="stake">
        <div className="mb-8 flex items-center gap-3">
            <StakeCategoryIcon className="size-10" />
            <p className="text-2xl font-medium text-nowrap">TOP STAKING POOLS</p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => {
                const pool = pools?.[i];
                return pool ? (
                    <StakePoolCard key={pool.address} pool={pool} rank={i} />
                ) : (
                    <ComingSoonCard key={i} />
                );
            })}
        </div>
    </GlowContainer>
);

