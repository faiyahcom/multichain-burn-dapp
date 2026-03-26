import Decimal from "decimal.js";
import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import {
    IconBurnCategory,
    IconParticipant,
    IconStack,
    IconSwapCategory,
    IconStackY,
    IconStats,
} from "@/assets/react";
import { safeDecimalParse, shortenNumber } from "@/utils/helpers/numbers";
import type {
    StatsStickerResponse,
    TokenAmount,
} from "@/services/dashboardService";
import BurnTrackerImage from "/images/dashboard/burn-tracker.png";
import SwapChartStatsImage from "/images/dashboard/swap-stats.png";
import { useNavigate } from "@tanstack/react-router";

export const sumTokenAmounts = (items: TokenAmount[]): string => {
    const total = items.reduce((acc, item) => {
        const parsed = safeDecimalParse({ value: item.amount, throwValue: null });
        if (!parsed) return acc;
        return acc.add(parsed.div(new Decimal(10).pow(item.decimals)));
    }, new Decimal(0));
    return shortenNumber({ number: total.toNumber() }) as string;
};

// ── Shared stat row ────────────────────────────────────────────────────────────

const HeroStatRow = ({
    icon,
    label,
    value,
    valueClass,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    valueClass: string;
}) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                {icon}
            </div>
            <span className="text-base font-medium text-mb-gray-b8 sm:text-xl">{label}</span>
        </div>
        <div className={`text-base font-medium sm:text-xl ${valueClass}`}>{value}</div>
    </div>
);

interface Props {
    data?: StatsStickerResponse;
}

export const BurnSwapHero = ({ data }: Props) => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Burn Tracker */}
            <GlowContainer className="relative flex flex-col overflow-visible sm:flex-row" variant="burn">
                <GlowContainer
                    variant="burn"
                    className="-mt-1 -mx-1 flex shrink-0 flex-col gap-8.75 px-5 py-6.25 sm:-mb-1 sm:mx-0 sm:-ml-1"
                >
                    <div className="flex items-center gap-3">
                        <IconBurnCategory className="size-10.75" />
                        <p className="text-2xl font-medium">BURN TRACKER</p>
                    </div>
                    <img src={BurnTrackerImage} alt="Burn Tracker" />
                    <Button
                        variant="burn"
                        size="big"
                        className="h-12 w-full sm:h-57px sm:w-275px"
                        onClick={() => {
                            navigate({ to: "/burn" });
                        }}
                    >
                        Start Burn
                    </Button>
                </GlowContainer>
                <div className="mx-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 py-4 font-inter sm:mr-5 sm:ml-7 sm:py-0">
                    <div className="flex items-center gap-2">
                        <IconBurnCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">BURN</p>
                    </div>
                    <p className="font-orbitron text-2xl font-medium text-mb-btn-burn uppercase text-burn-glow sm:text-[32px]">
                        {sumTokenAmounts(data?.burnSection?.volume ?? [])}
                    </p>
                    <p className="text-base font-medium text-mb-gray-b8/60">
                        Total Burned Volume
                    </p>
                    <HeroStatRow
                        icon={<IconStack />}
                        label="Total Transactions"
                        value={shortenNumber({ number: data?.burnSection?.totalTxns ?? 0 })}
                        valueClass="text-mb-btn-burn"
                    />
                    <HeroStatRow
                        icon={<IconStack />}
                        label="Total Pools"
                        value={shortenNumber({ number: data?.burnSection?.totalPools ?? 0 })}
                        valueClass="text-mb-btn-burn"
                    />
                    <HeroStatRow
                        icon={<IconParticipant className="text-mb-btn-burn" />}
                        label="Total Participants"
                        value={shortenNumber({ number: data?.burnSection?.totalParticipants ?? 0 })}
                        valueClass="text-mb-btn-burn"
                    />
                </div>
            </GlowContainer>

            {/* Token Swap */}
            <GlowContainer
                className="relative flex flex-col overflow-visible sm:flex-row-reverse"
                variant="swap"
            >
                <GlowContainer
                    variant="swap"
                    className="-mt-1 -mx-1 flex shrink-0 flex-col gap-8.75 px-5 py-6.25 sm:-mb-1 sm:mx-0 sm:-ml-1"
                >
                    <div className="flex items-center gap-3">
                        <IconSwapCategory className="size-10.75" />
                        <p className="text-2xl font-medium">TOKEN SWAP</p>
                    </div>
                    <img src={BurnTrackerImage} alt="Burn Tracker" />
                    <Button variant="swap" size="big" className="h-12 w-full sm:h-57px sm:w-275px">
                        Create Pool
                    </Button>
                </GlowContainer>
                <div className="mx-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 py-4 font-inter sm:mr-7 sm:ml-5 sm:py-0">
                    <div className="flex items-center gap-2">
                        <IconSwapCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">SWAP</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2.5">
                            <p className="font-orbitron text-2xl font-medium text-mb-btn-swap uppercase text-swap-glow sm:text-[32px]">
                                {sumTokenAmounts(data?.swapSection?.volume ?? [])}
                            </p>
                            <p className="text-base font-medium text-mb-gray-b8/60">
                                Total Swap Volume
                            </p>
                        </div>
                        <img src={SwapChartStatsImage} alt="Swap Stats" />
                    </div>
                    <HeroStatRow
                        icon={<IconStats />}
                        label="Total Transactions"
                        value={shortenNumber({ number: data?.swapSection?.totalTxns ?? 0 })}
                        valueClass="text-mb-btn-swap"
                    />
                    <HeroStatRow
                        icon={<IconStackY />}
                        label="Total Pools"
                        value={shortenNumber({ number: data?.swapSection?.totalPools ?? 0 })}
                        valueClass="text-mb-btn-swap"
                    />
                    <HeroStatRow
                        icon={<IconParticipant className="text-mb-swap-light" />}
                        label="Total Participants"
                        value={shortenNumber({ number: data?.swapSection?.totalParticipants ?? 0 })}
                        valueClass="text-mb-btn-swap"
                    />
                </div>
            </GlowContainer>
        </div>
    );
};
