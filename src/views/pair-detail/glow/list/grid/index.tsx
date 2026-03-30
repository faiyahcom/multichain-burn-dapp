import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import RatioDisplay from "@/components/common/ratio-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { renderBurnPoolTime } from "@/views/pool/glow/shared/helpers";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const PairDetailGlowListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const { filter } = usePairDetailSearchFilterStore();
  const isBurnPool = filter.type === 0;

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isBurnPool) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBurnPool]);

  return (
    <>
      <GridCardSkeleton count={12} isLoading={isLoading} />
      <NoData isLoading={isLoading} data={data} />
      {data && data.length > 0 && (
        <div className="global-grid">
          {data?.map((pool) => {
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
            return (
              <GridCard
                key={pool.address}
                variant="pair"
                topSection={
                  <div className="space-y-1 sm:space-y-2">
                    <p className="max-w-full truncate" title={pool.name}>
                      {pool.name}
                    </p>
                    <CopyableText
                      content={pool.address}
                      displayText={truncateString({
                        str: pool.address,
                      })}
                      classNames={{
                        displayText: "font-inter",
                      }}
                    />
                  </div>
                }
                bottomSection={
                  <div className="space-y-1 font-inter sm:space-y-2">
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
                    <MetricNumber number={pool.volume} isShorten />
                    {isBurnPool ? (
                      <p key={tick}>{renderBurnPoolTime(pool)}</p>
                    ) : (
                      <RatioDisplay
                        inValue={pool.rewardDenominator}
                        outValue={pool.rewardNumerator}
                        inSymbol={
                          pool.tokenInSymbolCustom ?? pool.tokenInSymbol
                        }
                        outSymbol={
                          pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol
                        }
                      />
                    )}
                  </div>
                }
                btn={{
                  asChild: true,
                  children: (
                    <Link
                      to={`/${isBurnPool ? "burn" : "swap"}/detail/${pool.address}`}
                    >
                      {isBurnPool ? getPoolStatusLabel(pool.status) : "View"}
                    </Link>
                  ),
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default PairDetailGlowListGrid;
