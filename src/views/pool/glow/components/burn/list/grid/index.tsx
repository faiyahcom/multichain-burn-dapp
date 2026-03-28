import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import { chainIdToNetworkConfig } from "@/config/networks";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { formatCountdown, truncateString } from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const BurnPoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderBurnPoolTime = (pool: PoolItemType) => {
    const timeStart = Number(pool.timeStart);
    const timeEnd = Number(pool.timeEnd);

    if (pool.status === "upcoming") {
      if (isNaN(timeStart)) return "N/A";
      const diffStart = timeStart - nowInSeconds;
      return `In ${formatCountdown(Math.max(0, diffStart))}`;
    }

    if (pool.status === "on_going") {
      if (isNaN(timeEnd)) return "N/A";
      const diffEnd = timeEnd - nowInSeconds;
      if (diffEnd > 0) return formatCountdown(diffEnd);
      return getPoolStatusLabel("ended");
    }

    if (pool.status === "ended") {
      if (isNaN(timeEnd)) return "N/A";
      const diffEnd = nowInSeconds - timeEnd;
      return `${formatCountdown(Math.max(0, diffEnd))} ago`;
    }

    return "N/A";
  };

  return (
    <>
      <GridCardSkeleton
        count={12}
        isLoading={isLoading}
        classNames={{ container: "gap-y-5 sm:gap-y-10" }}
      />
      <NoData isLoading={isLoading} data={data} />
      {data && data.length > 0 && (
        <div className="global-grid gap-y-5 sm:gap-y-10">
          {data.map((pool) => {
            const network = chainIdToNetworkConfig(pool.chainId);

            const tokenOutDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: pool.tokenOut,
              tokenSymbol: pool.tokenOutSymbol,
              tokenName: pool.tokenOutSymbol,
              customName: pool.tokenOutSymbolCustom ?? undefined,
              customSymbol: pool.tokenOutSymbolCustom ?? undefined,
              imageUri: pool.tokenOutImageUri ?? undefined,
            });

            const tokenInDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: pool.tokenIn,
              tokenSymbol: pool.tokenInSymbol,
              tokenName: pool.tokenInSymbol,
              customName: pool.tokenInSymbolCustom ?? undefined,
              customSymbol: pool.tokenInSymbolCustom ?? undefined,
              imageUri: pool.tokenInImageUri ?? undefined,
            });

            const statusLabel = getPoolStatusLabel(pool.status);

            return (
              <GridCard
                key={pool.address}
                variant="burn"
                topSection={
                  <div className="space-y-1 text-xl sm:space-y-2 sm:text-28px">
                    <p className="max-w-full truncate" title={pool.name}>
                      {pool.name}
                    </p>
                    <CopyableText
                      content={pool.address}
                      displayText={truncateString({ str: pool.address })}
                      classNames={{
                        displayText: "font-inter",
                      }}
                    />
                  </div>
                }
                bottomSection={
                  <div className="space-y-1 font-inter text-base sm:space-y-2 sm:text-2xl">
                    <TokenOutInNetworkDisplay
                      tokenOutProps={{
                        src: tokenOutDisplay.imageUri,
                        alt: tokenOutDisplay.symbol,
                      }}
                      tokenInProps={{
                        src: tokenInDisplay.imageUri,
                        alt: tokenInDisplay.symbol,
                      }}
                      networkProps={{
                        chainId: pool.chainId,
                      }}
                      className="mx-auto"
                    />
                    <MetricNumber
                      number={sciToFormatted(
                        pool.liquidity,
                        pool.tokenOutDecimals,
                      )}
                      unit={tokenOutDisplay.symbol}
                      isShorten
                    />
                    <p key={tick}>{renderBurnPoolTime(pool)}</p>
                  </div>
                }
                btn={{
                  asChild: true,
                  children: (
                    <Link to={`/burn/detail/${pool.address}`}>
                      {statusLabel}
                    </Link>
                  ),
                }}
                classNames={{
                  content: "space-y-1.5 sm:space-y-3",
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default BurnPoolListGrid;
