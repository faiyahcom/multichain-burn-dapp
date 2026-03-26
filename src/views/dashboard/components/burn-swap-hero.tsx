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

interface Props {
    data?: StatsStickerResponse;
}

export const BurnSwapHero = ({ data }: Props) => {
    const navigate = useNavigate();
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Burn Tracker */}
            <GlowContainer className="relative flex overflow-visible" variant="burn">
                <GlowContainer
                    variant="burn"
                    className="-mt-1 -mb-1 -ml-1 flex shrink-0 flex-col gap-8.75 px-5 py-6.25"
                >
                    <div className="flex items-center gap-3">
                        <IconBurnCategory className="size-10.75" />
                        <p className="text-2xl font-medium">BURN TRACKER</p>
                    </div>
                    <img src={BurnTrackerImage} alt="Burn Tracker" />
                    <Button
                        variant="burn"
                        size="big"
                        className="w-275px h-57px"
                        onClick={() => {
                            navigate({ to: "/burn" });
                        }}
                    >
                        Start Burn
                    </Button>
                </GlowContainer>
                <div className="mr-5 ml-7 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 font-inter">
                    <div className="flex items-center gap-2">
                        <IconBurnCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">BURN</p>
                    </div>
                    <p className="font-orbitron text-[32px] font-medium text-mb-btn-burn uppercase text-burn-glow">
                        {sumTokenAmounts(data?.burnSection?.volume ?? [])}
                    </p>
                    <p className="text-base font-medium text-mb-gray-b8/60">
                        Total Burned Volume
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconStack />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Transactions
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-burn">
                            {shortenNumber({ number: data?.burnSection?.totalTxns ?? 0 })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconStack />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Pools
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-burn">
                            {shortenNumber({ number: data?.burnSection?.totalPools ?? 0 })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconParticipant className="text-mb-btn-burn" />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Participants
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-burn">
                            {shortenNumber({
                                number: data?.burnSection?.totalParticipants ?? 0,
                            })}
                        </div>
                    </div>
                </div>
            </GlowContainer>

            {/* Token Swap */}
            <GlowContainer
                className="relative flex flex-row-reverse overflow-visible"
                variant="swap"
            >
                <GlowContainer
                    variant="swap"
                    className="-mt-1 -mb-1 -ml-1 flex shrink-0 flex-col gap-8.75 px-5 py-6.25"
                >
                    <div className="flex items-center gap-3">
                        <IconSwapCategory className="size-10.75" />
                        <p className="text-2xl font-medium">TOKEN SWAP</p>
                    </div>
                    <img src={BurnTrackerImage} alt="Burn Tracker" />
                    <Button variant="swap" size="big" className="w-275px h-57px">
                        Create Pool
                    </Button>
                </GlowContainer>
                <div className="mr-7 ml-5 flex min-w-0 flex-1 flex-col justify-center space-y-2.5 font-inter">
                    <div className="flex items-center gap-2">
                        <IconSwapCategory className="size-7.25" />
                        <p className="font-orbitron text-xl font-medium">SWAP</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2.5">
                            <p className="font-orbitron text-[32px] font-medium text-mb-btn-swap uppercase text-swap-glow">
                                {sumTokenAmounts(data?.swapSection?.volume ?? [])}
                            </p>
                            <p className="text-base font-medium text-mb-gray-b8/60">
                                Total Swap Volume
                            </p>
                        </div>
                        <img src={SwapChartStatsImage} alt="Swap Stats" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconStats />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Transactions
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-swap">
                            {shortenNumber({ number: data?.swapSection?.totalTxns ?? 0 })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconStackY />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Pools
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-swap">
                            {shortenNumber({ number: data?.swapSection?.totalPools ?? 0 })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                <IconParticipant className="text-[#1DC0FB]" />
                            </div>
                            <span className="text-xl font-medium text-mb-gray-b8">
                                Total Participants
                            </span>
                        </div>
                        <div className="text-xl font-medium text-mb-btn-swap">
                            {shortenNumber({
                                number: data?.swapSection?.totalParticipants ?? 0,
                            })}
                        </div>
                    </div>
                </div>
            </GlowContainer>
        </div>
    );
};
