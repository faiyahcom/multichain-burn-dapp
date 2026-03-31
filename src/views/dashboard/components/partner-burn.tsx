import { useCallback, useEffect } from "react";
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
import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdown, truncateString } from "@/utils/helpers/string";
import PartnerBurnBgImage from "/images/dashboard/partner-burn-bg.png";
import { useNavigate } from "@tanstack/react-router";
import TokenDisplay from "@/components/common/token-display";

const POOL_LIMIT = 4;

// ── Pool Card ──────────────────────────────────────────────────────────────────

const LiveStatus = ({ timeEnd }: { timeEnd: string }) => {
    const remaining = useCountdown(Number(timeEnd));
    return (
        <div className="flex flex-col items-center gap-1 sm:gap-0.5 2xl:gap-1">
            <span className="text-xs font-medium sm:text-tiny 2xl:text-xs">
                Live {formatCountdown(remaining)}
            </span>
            <span className="text-xs font-semibold sm:text-tiny 2xl:text-xs">
                JOIN
            </span>
        </div>
    );
};

const PartnerPoolCard = ({ pool }: { pool: PartnerPool }) => {
    const navigate = useNavigate();
    const status = pool.status;
    const rewardFormatted = formatAmount(
        pool.rewardAmount,
        pool.tokenOutDecimals,
    );
    const poolName = truncateString({ str: pool.name, left: 10, right: 0 });
    const symbol = pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol;
    const daysUntil = Math.ceil(
        (Number(pool.timeStart) - Math.floor(Date.now() / 1000)) / 86400,
    );

    return (
        <GlowContainer
            variant="burn"
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-around overflow-hidden"
            onClick={() => {
                navigate({
                    to: `/burn/detail/${pool.address}`,
                });
            }}
        >
            {/* Fire background */}
            <img
                src={PartnerBurnBgImage}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-mb-burn-overlay/72" />

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between gap-1 p-1.5 text-center font-inter sm:gap-0 sm:px-1 sm:py-1.5 2xl:gap-1 2xl:px-2 2xl:py-2">
                <p className="max-w-full text-xs font-semibold sm:text-tiny 2xl:text-xs">
                    {poolName}
                </p>
                <p className="text-2xl font-semibold sm:text-sm 2xl:text-lg">
                    {rewardFormatted}
                </p>
                <TokenDisplay
                    symbol={pool.tokenInSymbol}
                    customSymbol={pool.tokenInSymbolCustom ?? undefined}
                    imageUri={pool.tokenInImageUri ?? undefined}
                    classNames={{
                        img: "size-11 sm:size-7.5 2xl:size-11",
                    }}
                    hasSymbol={false}
                />
                {status === "on_going" && <LiveStatus timeEnd={pool.timeEnd} />}
                {status === "upcoming" && (
                    <div className="flex flex-col items-center gap-0.5 sm:gap-px 2xl:gap-0.5">
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
        variant="burn"
        className="relative flex aspect-square flex-col items-center justify-center overflow-hidden"
    >
        <img
            src={PartnerBurnBgImage}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-mb-burn-overlay/72" />
        {/* make the icon absolute centered */}
        <IconBurnCategory className="absolute top-1/2 left-1/2 size-18 -translate-x-1/2 -translate-y-1/2 transform opacity-80 sm:size-9 2xl:size-18" />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform font-inter text-[15px] font-medium text-nowrap sm:text-tiny 2xl:text-[15px]">
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

const PoolCarousel = ({
    pools,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
}: PoolCarouselProps) => {
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
        return () => {
            emblaApi.off("scroll", onScroll);
        };
    }, [emblaApi, onScroll]);

    return (
        <div className="-m-4 overflow-hidden p-4">
            <div ref={emblaRef}>
                <div className="-ml-4 flex">
                    {pools.map((pool) => (
                        <div
                            key={`${pool.chainId}-${pool.address}`}
                            className="w-1/2 min-w-0 shrink-0 pl-4 sm:w-1/4"
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
