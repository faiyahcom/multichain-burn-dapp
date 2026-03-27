import CenterSpinner from "@/components/common/center-spinner";
import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import RatioDisplay from "@/components/common/ratio-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const SwapPoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  return (
    <>
      <CenterSpinner isLoading={isLoading} />
      <NoData isLoading={isLoading} data={data} />
      {data && data.length > 0 && (
        <div className="global-grid">
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
            return (
              // Client wants the order to be token out / token in, refers to MB-415
              <GridCard
                variant="swap"
                topSection={
                  <div className="space-y-1 text-xl sm:space-y-2 sm:text-28px">
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
                    <RatioDisplay
                      inValue={pool.rewardDenominator}
                      outValue={pool.rewardNumerator}
                      inSymbol={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                      outSymbol={
                        pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol
                      }
                    />
                  </div>
                }
                btn={{
                  children: (
                    <Link to={`/swap/detail/${pool.address}`}>Swap</Link>
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

export default SwapPoolListGrid;
