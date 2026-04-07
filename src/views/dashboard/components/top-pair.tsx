import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import TokenImage from "@/components/common/token-image";
import MetricNumber from "@/components/common/metric-number";
import { IconGlowArrow, IconPairCategory } from "@/assets/react";
import {
    type TopPair,
    type TopPairResponse,
} from "@/services/dashboardService";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { Link } from "@tanstack/react-router";

interface PairCardProps {
    pair: TopPair;
}

const PairCard = ({ pair }: PairCardProps) => {
    const network = chainIdToNetworkConfig(pair.chainId);

    const tokenOutDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pair.tokenOut,
        tokenSymbol: pair.tokenOutSymbol,
        tokenName: pair.tokenOutSymbol,
        customName: pair.tokenOutSymbolCustom ?? undefined,
        customSymbol: pair.tokenOutSymbolCustom ?? undefined,
        imageUri: pair.tokenOutImageUri ?? undefined,
    });

    const tokenInDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pair.tokenIn,
        tokenSymbol: pair.tokenInSymbol,
        tokenName: pair.tokenInSymbol,
        customName: pair.tokenInSymbolCustom ?? undefined,
        customSymbol: pair.tokenInSymbolCustom ?? undefined,
        imageUri: pair.tokenInImageUri ?? undefined,
    });

    const pairLabel = `${tokenOutDisplay.symbol} / ${tokenInDisplay.symbol}`;

    return (
        /* Only change: flex-col for mobile, flex-row for md: up */
        <div className="flex flex-col items-stretch gap-5 rounded-2xl border border-mb-pair-card-border bg-mb-dark-profile-btn p-5 md:flex-row md:items-center md:gap-3 md:rounded-xl md:p-3">
            <div className="flex min-w-0 flex-1 items-start gap-4 md:items-center md:gap-3">
                {/* Icons: size-12 on mobile, original size-8 on md: */}
                <div className="relative shrink-0 pr-1 pb-1 md:pr-2 md:pb-2">
                    <div className="flex items-center">
                        <TokenImage
                            src={tokenOutDisplay.imageUri}
                            alt={tokenOutDisplay.symbol}
                            classNames={{ common: "size-12 md:size-8 z-10" }}
                        />
                        <TokenImage
                            src={tokenInDisplay.imageUri}
                            alt={tokenInDisplay.symbol}
                            classNames={{ common: "size-12 md:size-8 -ml-3 md:-ml-2 z-0" }}
                        />
                    </div>
                    {network?.iconSrc && (
                        <img
                            src={network.iconSrc}
                            alt=""
                            /* Matches your original absolute positioning */
                            className="absolute right-0 bottom-0 size-5 rounded-full border border-mb-pair-card-border bg-[#0B1622] md:right-1 md:bottom-1 md:size-4"
                        />
                    )}
                </div>

                {/* Info block: Original text styles preserved */}
                <div className="min-w-0 flex-1 space-y-1.5 text-xs md:space-y-1">
                    <div className="flex items-center">
                        <span
                            className="truncate text-lg font-medium md:text-sm"
                            title={pairLabel}
                        >
                            {pairLabel}
                        </span>
                        <IconGlowArrow className="size-6 shrink-0 md:size-7.5" />
                    </div>

                    {/* Aligned metrics using grid */}
                    <div className="grid grid-cols-[80px_1fr] items-center font-space-mono sm:grid-cols-[160px_1fr] md:grid-cols-[100px_1fr] 2xl:grid-cols-[80px_1fr]">
                        <span className="text-slate-400">Liquidity</span>
                        <MetricNumber
                            number={pair.liquidity}
                            unit={tokenOutDisplay.symbol}
                            isShorten
                            classNames={{
                                container:
                                    "text-mb-pair-metric font-bold justify-end md:justify-start",
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-[80px_1fr] items-center font-space-mono sm:grid-cols-[160px_1fr] md:grid-cols-[100px_1fr] 2xl:grid-cols-[80px_1fr]">
                        <span className="text-slate-400">Volume</span>
                        <MetricNumber
                            number={pair.volume}
                            unit={tokenOutDisplay.symbol}
                            isShorten
                            classNames={{
                                container:
                                    "text-mb-pair-metric font-bold justify-end md:justify-start",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Button: Full width on mobile, original auto width on md: */}
            <Button
                variant="swap"
                className="mx-auto w-2/3 text-nowrap shrink-0 rounded-13px py-3 text-[16px] md:mx-0 md:w-auto md:px-6 md:py-3 md:text-[15px]"
                hasHover
            >
                <Link
                    to={`/pair-detail/${pair.chainId}/${pair.tokenIn}/${pair.tokenOut}`}
                >
                    Trade Now
                </Link>
            </Button>
        </div>
    );
};

interface Props {
    data?: TopPairResponse;
}

export const TopPairSection = ({ data }: Props) => {
    const pairs = data?.topPair ?? [];

    return (
        <GlowContainer className="px-5 py-4.5" variant="pair">
            <div className="mb-5 flex items-center gap-3">
                <IconPairCategory className="size-10.75" />
                <p className="text-2xl font-medium">TOP PAIR</p>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {pairs.map((pair, i) => (
                    <PairCard key={i} pair={pair} />
                ))}
            </div>
        </GlowContainer>
    );
};
