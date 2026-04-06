import CopyableText from "@/components/common/copyable-text";
import {
  Button,
  getButtonVariantFromContainerVariant,
} from "@/components/common/glow/button";
import { getVariantBorderClassName } from "@/components/common/glow/container";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import RatioDisplay from "@/components/common/ratio-display";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { chainIdToNetworkConfig } from "@/config/networks";
import { cn } from "@/lib/utils";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import SwapDialog from "@/views/swap-pool/swap-action/swap-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const SwapPoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [swapPoolAddress, setSwapPoolAddress] = useState<string | undefined>();

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

            return (
              // Client wants the order to be token out / token in, refers to MB-415
              <GridCard
                key={pool.address}
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
                  <div className="flex flex-1 flex-col items-stretch justify-between font-inter">
                    <div className="space-y-1 text-base sm:space-y-2 sm:text-2xl">
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
                        number={pool.liquidity}
                        unit={tokenOutDisplay.symbol}
                        isShorten
                      />
                    </div>

                    <RatioDisplay
                      inValue={pool.rewardDenominator}
                      outValue={pool.rewardNumerator}
                      inSymbol={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                      outSymbol={
                        pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol
                      }
                      equalSign="/"
                      classNames={{
                        container: "flex-1",
                      }}
                    />
                  </div>
                }
                btn={{
                  asChild: true,
                  children: (
                    <PoolChainGuard
                      chainId={pool.chainId}
                      variant="swap"
                      className="my-0 md:my-0"
                    >
                      <Button
                        variant={getButtonVariantFromContainerVariant({
                          containerVariant: "swap",
                          isGrid: true,
                        })}
                        className={cn(
                          "mx-auto min-w-45 pb-2.75",
                          getVariantBorderClassName({
                            variant: "swap",
                            custom: "rounded-13px border",
                          }),
                        )}
                        hasHover
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwapPoolAddress(pool.address);
                        }}
                      >
                        Swap
                      </Button>
                    </PoolChainGuard>
                  ),
                }}
                classNames={{
                  content:
                    "space-y-0 sm:space-y-0 flex flex-col gap-y-1.5 sm:gap-y-3 flex-1",
                  glowContainer: "flex flex-col justify-between",
                }}
              />
            );
          })}
        </div>
      )}

      <SwapDialog
        open={!!swapPoolAddress}
        onOpenChange={(open) => {
          if (!open) setSwapPoolAddress(undefined);
        }}
        poolAddress={swapPoolAddress}
        onSuccess={() => {
          setSwapPoolAddress(undefined);
          queryClient.invalidateQueries({
            queryKey: poolQueryKeys.list().filter(Boolean),
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: poolQueryKeys.recents({
              user: user?.address,
              poolKind: PoolKindCodeEnum.Swap,
            }),
            exact: false,
          });
        }}
      />
    </>
  );
};

export default SwapPoolListGrid;
