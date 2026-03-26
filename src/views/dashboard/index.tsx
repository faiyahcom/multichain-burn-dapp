import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import GlowContainer from "@/components/common/glow/container";
import { TickerBanner } from "@/views/dashboard/components/ticker-banner";
import {
    BurnActivityFeed,
    SwapActivityFeed,
    TransactionFeed,
} from "@/views/dashboard/components/activity-feed";
import {
    BurnSwapHero,
    sumTokenAmounts,
} from "@/views/dashboard/components/burn-swap-hero";
import { PartnerBurnSection } from "@/views/dashboard/components/partner-burn";
import { TopSwapperSection } from "@/views/dashboard/components/top-swapper";
import { TopPairSection } from "@/views/dashboard/components/top-pair";
import { dashboardService } from "@/services/dashboardService";
import { dashboardQueryKeys } from "@/services/queries/queryKey";
import TokenListGlow from "@/components/common/glow/token-list";
import { useScrollingFeed } from "@/hooks/useScrollingFeed";
import { useActivityStream } from "@/hooks/useActivityStream";

const DEFAULT_POOL_LIMIT = 4;

const HomeDashboard = () => {
    const { data } = useQuery({
        queryKey: dashboardQueryKeys.statsSticker(),
        queryFn: () => dashboardService.getStatsSticker(),
    });

    const { data: latestActivityData } = useQuery({
        queryKey: dashboardQueryKeys.latestActivity(),
        queryFn: () => dashboardService.getLatestActivity(),
        staleTime: 5 * 60 * 1_000, // 5 minutes — SSE handles realtime updates
        refetchOnWindowFocus: false,
    });

    const burnItems = useMemo(
        () => latestActivityData?.burnActivities ?? [],
        [latestActivityData],
    );
    const swapItems = useMemo(
        () => latestActivityData?.swapActivities ?? [],
        [latestActivityData],
    );
    const txnItems = useMemo(
        () => latestActivityData?.transactions ?? [],
        [latestActivityData],
    );

    const burnFeed = useScrollingFeed(burnItems);
    const swapFeed = useScrollingFeed(swapItems);
    const txnFeed = useScrollingFeed(txnItems, 6);

    useActivityStream({
        onBurnActivity: (item) => burnFeed.addItems([item]),
        onSwapActivity: (item) => swapFeed.addItems([item]),
        onTransaction: (item) => txnFeed.addItems([item]),
    });

    const { data: topSwapperData } = useQuery({
        queryKey: dashboardQueryKeys.topSwapper({ limit: DEFAULT_POOL_LIMIT }),
        queryFn: () =>
            dashboardService.getTopSwapper({ limit: DEFAULT_POOL_LIMIT }),
    });

    const { data: topPairData } = useQuery({
        queryKey: dashboardQueryKeys.topPair({ limit: 6 }),
        queryFn: () => dashboardService.getTopPair({ limit: 6 }),
    });

    const tickerItems = data
        ? [
            `TVL: ${sumTokenAmounts(data.tvl ?? [])}`,
            `TOTAL VOLUME: ${sumTokenAmounts(data.volume ?? [])}`,
            `TOTAL TRANSACTIONS: ${data.totalTxns?.toLocaleString() ?? "-"}`,
            `TOTAL ACTIVITIES: ${data.totalActivities?.toLocaleString() ?? "-"}`,
            `TOTAL POOLS: ${data.totalPools?.toLocaleString() ?? "-"}`,
        ]
        : [
            "TVL: -",
            "TOTAL VOLUME: -",
            "TOTAL TRANSACTIONS: -",
            "TOTAL ACTIVITIES: -",
            "TOTAL POOLS: -",
        ];

    return (
        <div className="space-y-6">
            <TickerBanner items={tickerItems} />

            <BurnSwapHero data={data} />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <PartnerBurnSection />
                <TopSwapperSection data={topSwapperData} />
            </div>

            <GlowContainer className="px-5 py-4.5" variant="burn">
                <BurnActivityFeed
                    visibleItems={burnFeed.visibleItems}
                    animKey={burnFeed.animKey}
                />
            </GlowContainer>
            <GlowContainer className="px-5 py-4.5" variant="swap">
                <SwapActivityFeed
                    visibleItems={swapFeed.visibleItems}
                    animKey={swapFeed.animKey}
                />
            </GlowContainer>
            <TopPairSection data={topPairData} />
            <TokenListGlow variant="pair" />
            <GlowContainer variant="pair">
                <TransactionFeed
                    visibleItems={txnFeed.visibleItems}
                    animKey={txnFeed.animKey}
                />
            </GlowContainer>
        </div>
    );
};

export default HomeDashboard;
