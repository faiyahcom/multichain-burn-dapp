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
import { sciToFormatted } from "@/utils/helpers/numbers";
import { Link } from "@tanstack/react-router";

interface PairCardProps {
    pair: TopPair;
}

const PairCard = ({ pair }: PairCardProps) => {
    const network = chainIdToNetworkConfig(pair.chainId);

    // Client convention: tokenOut / tokenIn order (same as pair-list MB-415)
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
    const liquidityFormatted = sciToFormatted(
        pair.liquidity,
        pair.tokenOutDecimals,
    );

    return (
        <div className="flex items-center gap-3 rounded-xl border border-mb-pair-card-border bg-mb-dark-profile-btn p-3">
            {/* Token pair icons with network chain icon overlay */}
            <div className="relative shrink-0 pr-2 pb-2">
                <div className="flex items-center">
                    <TokenImage
                        src={tokenOutDisplay.imageUri}
                        alt={tokenOutDisplay.symbol}
                        classNames={{ common: "size-8 z-10" }}
                    />
                    <TokenImage
                        src={tokenInDisplay.imageUri}
                        alt={tokenInDisplay.symbol}
                        classNames={{ common: "size-8 -ml-2 z-0" }}
                    />
                </div>
                {network?.iconSrc && (
                    <img
                        src={network.iconSrc}
                        alt=""
                        className="absolute right-1 bottom-1 size-4 rounded-full border border-mb-pair-card-border"
                    />
                )}
            </div>

            {/* Info block */}
            <div className="min-w-0 flex-1 space-y-1 text-xs">
                {/* Pair name + glowing separator */}
                <div className="flex items-center">
                    <span
                        className="min-w-0 truncate text-sm font-medium"
                        title={pairLabel}
                    >
                        {pairLabel}
                    </span>
                    <IconGlowArrow className="size-7.5 shrink-0" />
                </div>

                {/* Liquidity */}
                <div className="flex items-center gap-2 font-space-mono">
                    <span className="text-slate-400">Liquidity</span>
                    <MetricNumber
                        number={liquidityFormatted}
                        unit={tokenOutDisplay.symbol}
                        isShorten
                        classNames={{ container: "text-mb-pair-metric font-bold" }}
                    />
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 font-space-mono">
                    <span className="text-slate-400">Volume</span>
                    <MetricNumber
                        number={pair.volume}
                        isShorten
                        classNames={{ container: "text-mb-pair-metric font-bold" }}
                    />
                </div>
            </div>

            {/* Trade Now button */}
            <Button
                variant="swap"
                asChild
                className="shrink-0 rounded-13px px-6 py-3 text-[15px] md:text-[15px]"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {pairs.map((pair, i) => (
                    <PairCard key={i} pair={pair} />
                ))}
            </div>
        </GlowContainer>
    );
};
