import CenterSpinner from "@/components/common/center-spinner";
import GridCard from "@/components/common/glow/grid-card";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import NoData from "@/components/common/no-data";
import TokenImage from "@/components/common/token-image";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { PairItemType } from "@/types/pair";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { Link } from "@tanstack/react-router";

interface Props {
  data?: PairItemType[];
  isLoading?: boolean;
}

const PairListGlowListGrid: React.FC<Props> = ({ data, isLoading }) => {
  return (
    <>
      <CenterSpinner isLoading={isLoading} />
      <NoData isLoading={isLoading} data={data} />
      {data && data.length > 0 && (
        <div className="global-grid">
          {data.map((item, index) => {
            const network = chainIdToNetworkConfig(item.chainId);

            const tokenOutDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: item.tokenOut,
              tokenSymbol: item.tokenOutSymbol,
              tokenName: item.tokenOutSymbol,
              customName: item.tokenOutSymbolCustom ?? undefined,
              customSymbol: item.tokenOutSymbolCustom ?? undefined,
              imageUri: item.tokenOutImageUri ?? undefined,
            });

            const tokenInDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: item.tokenIn,
              tokenSymbol: item.tokenInSymbol,
              tokenName: item.tokenInSymbol,
              customName: item.tokenInSymbolCustom ?? undefined,
              customSymbol: item.tokenInSymbolCustom ?? undefined,
              imageUri: item.tokenInImageUri ?? undefined,
            });
            return (
              // Client wants the order to be token out / token in, refers to MB-415
              <GridCard
                key={index}
                variant="pair"
                topSection={
                  <div className="w-full space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-center gap-3 sm:gap-6">
                      <TokenImage
                        src={tokenOutDisplay.imageUri}
                        alt={tokenOutDisplay.symbol}
                        classNames={{
                          common: "size-8 sm:size-11",
                        }}
                      />
                      <TokenImage
                        src={tokenInDisplay.imageUri}
                        alt={tokenInDisplay.symbol}
                        classNames={{
                          common: "size-8 sm:size-11",
                        }}
                      />
                    </div>
                    <p
                      className="w-full min-w-0 truncate"
                      title={`${tokenOutDisplay.symbol} / ${tokenInDisplay.symbol}`}
                    >
                      {tokenOutDisplay.symbol} / {tokenInDisplay.symbol}
                    </p>
                    <NetworkDisplay
                      chainId={item.chainId}
                      classNames={{
                        container: "flex items-center gap-3 justify-center",
                        img: "sm:size-6.25 mr-0",
                        label: "text-sm",
                      }}
                    />
                  </div>
                }
                bottomSection={
                  <div className="w-full space-y-1 sm:space-y-2">
                    <MetricNumber number={item.volume} isShorten />
                    <MetricNumber
                      number={sciToFormatted(
                        item.liquidity,
                        item.tokenOutDecimals,
                      )}
                      unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                      isShorten
                    />
                  </div>
                }
                btn={{
                  asChild: true,
                  children: (
                    <Link
                      to={`/pair-detail/${item.chainId}/${item.tokenIn}/${item.tokenOut}`}
                    >
                      View Pool
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

export default PairListGlowListGrid;
