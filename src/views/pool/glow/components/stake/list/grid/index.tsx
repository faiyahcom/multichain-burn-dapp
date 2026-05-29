import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolQueryKeys } from "@/services/queries/queryKey";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { renderPoolTime } from "@/views/pool/glow/shared/helpers";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useReducer } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const StakePoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(forceUpdate, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOnTimeEnd = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: poolQueryKeys.list().filter(Boolean),
      exact: false,
    });
  }, []);

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
                variant="stake"
                topSection={
                  <div className="relative space-y-1 text-xl sm:space-y-2 sm:text-28px">
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
                  <div className="relative space-y-1 font-inter text-base sm:space-y-2 sm:text-2xl">
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
                        pool.stakedAmount,
                        pool.tokenInDecimals,
                      )}
                      unit={tokenInDisplay.symbol}
                      isShorten
                    />
                    <p>{renderPoolTime(pool, handleOnTimeEnd)}</p>
                  </div>
                }
                btn={{
                  children: statusLabel,
                  hasGroupHover: true,
                }}
                classNames={{
                  content: "space-y-1.5 sm:space-y-3",
                  container: "cursor-pointer group",
                }}
                onContainerClick={() => {
                  navigate({
                    to: "/staking/detail/$address",
                    params: { address: pool.address },
                  });
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
};

export default StakePoolListGrid;
