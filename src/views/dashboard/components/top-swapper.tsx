import GlowContainer from "@/components/common/glow/container";
import { IconSwapCategory } from "@/assets/react";
import type {
    TopSwapper,
    TopSwapperResponse,
} from "@/services/dashboardService";
import { truncateString } from "@/utils/helpers/string";
import TopSwapperBgImage from "/images/dashboard/top-swapper-bg.png";
import Medal1Image from "/images/dashboard/medal-1.png";
import Medal2Image from "/images/dashboard/medal-2.png";
import Medal3Image from "/images/dashboard/medal-3.png";

const MEDALS = [Medal1Image, Medal2Image, Medal3Image];

interface SwapperCardProps {
    swapper: TopSwapper | undefined;
    rank: number; // 0-indexed
}

const SwapperCard = ({ swapper, rank }: SwapperCardProps) => {
    const medal = rank < 3 ? MEDALS[rank] : undefined;
    const displayName =
        swapper?.name ??
        (swapper?.address
            ? truncateString({ str: swapper.address, left: 4, right: 4 })
            : "—");

    return (
        <GlowContainer
            className="relative aspect-square overflow-hidden p-3"
            variant="swap"
        >
            {/* Background */}
            <img
                src={TopSwapperBgImage}
                alt=""
                className="object-fit pointer-events-none absolute inset-0 h-full w-full"
            />

            {/* Medal */}
            {medal && (
                <img
                    src={medal}
                    alt={`Rank ${rank + 1}`}
                    className="absolute top-2 left-2 z-10 size-7"
                />
            )}

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between gap-[8.5px] font-inter text-[8px] font-medium text-primary-foreground">
                {/* Name */}
                <p className="max-w-full truncate text-center text-[9px]">
                    {displayName}
                </p>

                {/* Avatar */}
                <div className="size-9.5 overflow-hidden rounded-full bg-mb-gray-b8/20">
                    {swapper?.avatar ? (
                        <img
                            src={swapper.avatar}
                            alt={displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-mb-gray-b8">
                            {displayName?.[0]?.toUpperCase() ?? "?"}
                        </div>
                    )}
                </div>

                {/* Crypto Guy */}
                <div className="rounded-[4px] border-[0.5px] border-[#162E8F] bg-[#0A1A65] px-1 py-0.5">
                    Crypto Guy
                </div>

                {/* Stats */}
                <div className="w-full space-y-[8.5px] text-center">
                    <p className="tracking-[-2%]">
                        Participated swap pools:{" "}
                        <span className="">
                            {swapper?.totalJoinedSwapPools?.toLocaleString() ?? "-"}
                        </span>
                    </p>
                    <p className="">
                        Swap count:{" "}
                        <span className="">
                            {swapper?.totalSwapTxns?.toLocaleString() ?? "-"}
                        </span>
                    </p>
                </div>
            </div>
        </GlowContainer>
    );
};

interface Props {
    data?: TopSwapperResponse;
}

export const TopSwapperSection = ({ data }: Props) => {
    const swappers = data?.topSwapper ?? [];

    // Always render 4 slots
    const slots = Array.from({ length: 4 }, (_, i) => swappers[i]);

    return (
        <GlowContainer className="px-5 py-6.25" variant="swap">
            <div className="mb-6 flex items-center gap-3">
                <IconSwapCategory className="size-10.75" />
                <p className="text-2xl font-medium">TOP SWAPPER</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {slots.map((swapper, i) => (
                    <SwapperCard key={i} swapper={swapper} rank={i} />
                ))}
            </div>
        </GlowContainer>
    );
};
