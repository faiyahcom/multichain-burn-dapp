import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import GlowContainer from "@/components/common/glow/container";
import { TickerBanner } from "@/views/dashboard/components/ticker-banner";
import {
    dashboardService,
    type TokenAmount,
} from "@/services/dashboardService";
import { dashboardQueryKeys } from "@/services/queries/queryKey";
import { safeDecimalParse, shortenNumber } from "@/utils/helpers/numbers";
import { IconBurnCategory, IconParticipant, IconStack } from "@/assets/react";
import BurnTrackerImage from "/images/burn-tracker.png";

type Props = {};

const sumTokenAmounts = (items: TokenAmount[]): string => {
    const total = items.reduce((acc, item) => {
        const parsed = safeDecimalParse({ value: item.amount, throwValue: null });
        if (!parsed) return acc;
        return acc.add(parsed.div(new Decimal(10).pow(item.decimals)));
    }, new Decimal(0));
    return shortenNumber({ number: total.toNumber() }) as string;
};

const HomeDashboard = ({ }: Props) => {
    const { data } = useQuery({
        queryKey: dashboardQueryKeys.statsSticker(),
        queryFn: () => dashboardService.getStatsSticker(),
    });

    const tickerItems = data
        ? [
            `TVL: ${sumTokenAmounts(data?.tvl ?? [])}`,
            `TOTAL VOLUME: ${sumTokenAmounts(data?.volume ?? [])}`,
            `TOTAL TRANSACTIONS: ${data?.totalTxns?.toLocaleString() ?? "-"}`,
            `TOTAL ACTIVITIES: ${data?.totalActivities?.toLocaleString() ?? "-"}`,
            `TOTAL POOLS: ${data?.totalPools?.toLocaleString() ?? "-"}`,
        ]
        : [
            "TVL: -",
            "TOTAL VOLUME: -",
            "TOTAL TRANSACTIONS: -",
            "TOTAL ACTIVITIES: -",
            "TOTAL POOLS: -",
        ];

    console.log("Dashboard stats sticker data:", data);
    return (
        <div className="space-y-6">
            <TickerBanner items={tickerItems} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <GlowContainer
                    className="relative flex overflow-visible"
                    variant="burn"
                >
                    <GlowContainer variant="burn" className="-mt-1 -mb-1 -ml-1 shrink-0">
                        <div className="flex items-center gap-3">
                            <IconBurnCategory className="size-10.75" />
                            <p className="text-2xl font-medium">BURN TRACKER</p>
                        </div>
                        <img src={BurnTrackerImage} alt="Burn Tracker" />
                    </GlowContainer>
                    <div className="mt-7.5 mr-5 ml-7 min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <IconBurnCategory className="size-7.25" />
                            <p className="text-xl font-medium">BURN</p>
                        </div>
                        <p className="text-40px font-medium text-mb-btn-burn text-burn-glow">
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
                                <span className="text-15px font-medium text-mb-gray-b8">
                                    Total Transactions
                                </span>
                            </div>
                            <div className="text-15px font-medium text-mb-btn-burn">
                                {shortenNumber({ number: data?.burnSection?.totalTxns ?? 0 })}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                    <IconStack />
                                </div>
                                <span className="text-15px font-medium text-mb-gray-b8">
                                    Total Pools
                                </span>
                            </div>
                            <div className="text-15px font-medium text-mb-btn-burn">
                                {shortenNumber({ number: data?.burnSection?.totalPools ?? 0 })}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="flex size-10 items-center justify-center rounded-[6px] bg-mb-btn-burn/10">
                                    <IconParticipant />
                                </div>
                                <span className="text-15px font-medium text-mb-gray-b8">
                                    Total Participants
                                </span>
                            </div>
                            <div className="text-15px font-medium text-mb-btn-burn">
                                {shortenNumber({
                                    number: data?.burnSection?.totalParticipants ?? 0,
                                })}
                            </div>
                        </div>
                    </div>
                </GlowContainer>

                <GlowContainer className="" variant="swap"></GlowContainer>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <GlowContainer className="" variant="burn"></GlowContainer>
                <GlowContainer className="" variant="swap"></GlowContainer>
            </div>
        </div>
    );
};

export default HomeDashboard;
