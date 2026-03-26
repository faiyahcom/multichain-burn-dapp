import { useCallback, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import GlowContainer from "@/components/common/glow/container";
import TokenImage from "@/components/common/token-image";
import { IconBurnCategory } from "@/assets/react";
import { dashboardService } from "@/services/dashboardService";
import type { PartnerPool } from "@/services/dashboardService";
import { dashboardQueryKeys } from "@/services/queries/queryKey";
import { formatAmount } from "@/utils/helpers/numbers";
import PartnerBurnBgImage from "/images/dashboard/partner-burn-bg.png";

const POOL_LIMIT = 4;

// ── Helpers ───────────────────────────────────────────────────────────────────

type PoolStatus = "live" | "upcoming" | "ended";

function resolveStatus(pool: PartnerPool): PoolStatus {
    const s = pool.status?.toLowerCase();
    if (s === "live" || s === "upcoming" || s === "ended") return s;
    const now = Math.floor(Date.now() / 1000);
    const start = Number(pool.timeStart);
    const end = Number(pool.timeEnd);
    if (now >= start && now <= end) return "live";
    if (now < start) return "upcoming";
    return "ended";
}

function formatCountdown(totalSeconds: number): string {
    const s = Math.max(0, totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(targetTimestamp: number) {
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000)),
    );
    useEffect(() => {
        const id = setInterval(() => {
            setRemaining(
                Math.max(0, targetTimestamp - Math.floor(Date.now() / 1000)),
            );
        }, 1000);
        return () => clearInterval(id);
    }, [targetTimestamp]);
    return remaining;
}

// ── Pool Card ──────────────────────────────────────────────────────────────────

const LiveStatus = ({ timeEnd }: { timeEnd: string }) => {
    const remaining = useCountdown(Number(timeEnd));
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium">
                Live {formatCountdown(remaining)}
            </span>
            <span className="text-xs font-medium">JOIN</span>
        </div>
    );
};

const PartnerPoolCard = ({ pool }: { pool: PartnerPool }) => {
    const status = resolveStatus(pool);
    const rewardFormatted = formatAmount(
        pool.rewardAmount,
        pool.tokenOutDecimals,
    );
    const symbol = pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol;
    const daysUntil = Math.ceil(
        (Number(pool.timeStart) - Math.floor(Date.now() / 1000)) / 86400,
    );

    return (
        <GlowContainer
            variant="burn"
            className="relative flex aspect-square flex-col items-center justify-around overflow-hidden"
        >
            {/* Fire background */}
            <img
                src={PartnerBurnBgImage}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-[#301300]/72" />

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between gap-1 px-2 py-2 text-center font-inter">
                <p className="max-w-full truncate text-xs font-semibold">{pool.name}</p>
                <p className="text-lg font-semibold">{rewardFormatted}</p>
                <TokenImage
                    src={pool.tokenInImageUri ?? undefined}
                    alt={symbol}
                    classNames={{ common: "size-11" }}
                />
                {status === "live" && <LiveStatus timeEnd={pool.timeEnd} />}
                {status === "upcoming" && (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium">Upcoming</span>
                        <span className="text-xs font-medium">
                            {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
                {status === "ended" && (
                    <span className="text-xs font-medium">Ended</span>
                )}
            </div>
        </GlowContainer>
    );
};

const ComingSoonCard = () => (
    <GlowContainer
        variant="burn"
        className="relative flex aspect-square flex-col items-center justify-center overflow-hidden"
    >
        <img
            src={PartnerBurnBgImage}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#301300]/72" />
        {/* make the icon absolute centered */}
        <IconBurnCategory className="absolute top-1/2 left-1/2 size-18 -translate-x-1/2 -translate-y-1/2 transform opacity-80" />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform font-inter text-[15px] font-medium text-nowrap">
            Coming soon
        </p>
    </GlowContainer>
);

// ── Carousel (> 4 total items) ─────────────────────────────────────────────────

interface PoolCarouselProps {
    pools: PartnerPool[];
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
}

const PoolCarousel = ({ pools, hasNextPage, isFetchingNextPage, fetchNextPage }: PoolCarouselProps) => {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: false, align: "start", dragFree: true },
        [
            AutoScroll({
                speed: 1,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
                startDelay: 0,
            }),
        ],
    );

    // Once all pages are loaded, switch to loop mode so it cycles back to start
    useEffect(() => {
        if (!emblaApi || hasNextPage || isFetchingNextPage) return;
        emblaApi.reInit({ loop: true, align: "start", dragFree: true });
    }, [emblaApi, hasNextPage, isFetchingNextPage]);

    // Fetch next page when 75% through the current slides
    const onScroll = useCallback(() => {
        if (!emblaApi || !hasNextPage || isFetchingNextPage) return;
        if (emblaApi.scrollProgress() >= 0.75) {
            fetchNextPage();
        }
    }, [emblaApi, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on("scroll", onScroll);
        return () => { emblaApi.off("scroll", onScroll); };
    }, [emblaApi, onScroll]);

    return (
        <div className="-m-4 overflow-hidden p-4">
            <div ref={emblaRef}>
                <div className="flex -ml-4">
                    {pools.map((pool) => (
                        <div
                            key={`${pool.chainId}-${pool.address}`}
                            style={{ flex: "0 0 25%" }}
                            className="min-w-0 pl-4"
                        >
                            <PartnerPoolCard pool={pool} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Section ───────────────────────────────────────────────────────────────────

export const PartnerBurnSection = () => {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: dashboardQueryKeys.partnerPools({ limit: POOL_LIMIT }),
            queryFn: ({ pageParam }) =>
                dashboardService.getPartnerPools({
                    limit: POOL_LIMIT + 2,
                    page: pageParam as number,
                }),
            initialPageParam: 1,
            getNextPageParam: (lastPage, allPages) => {
                const fetched = allPages.flatMap((p) => p.partnerPools).length;
                return fetched < lastPage.total ? allPages.length + 1 : undefined;
            },
        });

    const allPools = data?.pages.flatMap((p) => p.partnerPools) ?? [];
    const total = data?.pages[0]?.total ?? 0;
    const showCarousel = total > POOL_LIMIT;

    return (
        <GlowContainer className="px-5 py-6.25" variant="burn">
            <div className="mb-6 flex items-center gap-3">
                <IconBurnCategory className="size-10.75" />
                <p className="text-2xl font-medium">PARTNER BURN</p>
            </div>

            {showCarousel ? (
                <PoolCarousel
                    pools={allPools}
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                />
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Array.from({ length: POOL_LIMIT }, (_, i) => {
                        const pool = allPools[i];
                        return pool ? (
                            <PartnerPoolCard
                                key={`${pool.chainId}-${pool.address}`}
                                pool={pool}
                            />
                        ) : (
                            <ComingSoonCard key={i} />
                        );
                    })}
                </div>
            )}
        </GlowContainer>
    );
};
