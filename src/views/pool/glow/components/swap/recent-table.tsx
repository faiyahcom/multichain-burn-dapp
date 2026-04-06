import { IconSwapCategory } from "@/assets/react";
import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/glow/table";
import TableNoData from "@/components/common/glow/table-no-data";
import TableSkeleton from "@/components/common/glow/table-skeleton";
import TokenOutInInterceptDisplay from "@/components/common/glow/token-out-in-intercept-display";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import RatioDisplay from "@/components/common/ratio-display";
import ConnectButton from "@/components/layout/header/connect-button";
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { swapPoolStatuses } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

const SwapRecentPoolsTable = ({}: {}) => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!user?.address;

  const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
    queryKey: poolQueryKeys.recents({
      user: user?.address,
      poolKind: PoolKindCodeEnum.Swap,
    }),
    queryFn: () =>
      poolService.getRecentPools({
        poolKind: PoolKindCodeEnum.Swap,
        user: user?.address,
        statuses: swapPoolStatuses[0], // ongoing only
      }),
    enabled: isAuthenticated,
  });

  const columns = ["Pool", "Pair", "Ratio", "Liquidity", "Network", "Action"];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `200px`;

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={column}
                variant="swap"
                className="h-12 pt-2 align-baseline"
                style={{
                  width: index === 0 ? fixWidth : cellWidth, // 200px for first column
                  minWidth: index === 0 ? fixWidth : "", // 200px for first column
                }}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isAuthenticated && (
            <TableSkeleton
              colCount={columns.length}
              rowCount={2}
              isLoading={isRecentPoolsPending}
            />
          )}
          {isAuthenticated && (
            <TableNoData
              colSpan={columns.length}
              data={recentPools?.pools}
              isLoading={isRecentPoolsPending}
              text="No pools found"
            />
          )}
          {!isAuthenticated && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="flex w-full items-center justify-center py-5 font-orbitron">
                  <ConnectButton />
                </div>
              </TableCell>
            </TableRow>
          )}
          {isAuthenticated &&
            recentPools?.pools?.map((pool) => {
              const network = chainIdToNetworkConfig(pool.chainId);
              const tokenInDisplay = resolvePoolTokenDisplay({
                network,
                tokenAddress: pool.tokenIn,
                tokenSymbol: pool.tokenInSymbol,
                tokenName: pool.tokenInSymbol,
                customName: pool.tokenInSymbolCustom ?? undefined,
                customSymbol: pool.tokenInSymbolCustom ?? undefined,
                imageUri: pool.tokenInImageUri ?? undefined,
              });
              const tokenOutDisplay = resolvePoolTokenDisplay({
                network,
                tokenAddress: pool.tokenOut,
                tokenSymbol: pool.tokenOutSymbol,
                tokenName: pool.tokenOutSymbol,
                customName: pool.tokenOutSymbolCustom ?? undefined,
                customSymbol: pool.tokenOutSymbolCustom ?? undefined,
                imageUri: pool.tokenOutImageUri ?? undefined,
              });

              const href = `/swap/detail/${pool.address}`;

              return (
                <TableRow
                  key={pool.address}
                  className="cursor-pointer font-medium"
                  onClick={() => {
                    navigate({
                      to: href,
                    });
                  }}
                  variant="swap"
                >
                  <TableCell
                    className="w-(--max-w) min-w-0 text-left"
                    style={
                      {
                        "--max-w": fixWidth,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                      <IconSwapCategory className="size-10.75 shrink-0" />
                      {/* max-w - spacing * (10.75 + 3) */}
                      <div className="max-w-[calc(var(--max-w)-var(--spacing)*13.75)] min-w-0">
                        <p
                          className="max-w-full min-w-0 truncate font-semibold"
                          title={pool.name}
                        >
                          {pool.name}
                        </p>
                        <CopyableText
                          content={pool.address}
                          displayText={truncateString({ str: pool.address })}
                          classNames={{
                            container: "justify-start",
                            displayText: "text-base sm:text-xl",
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TokenOutInInterceptDisplay
                      tokenOutProps={{
                        src: tokenOutDisplay.imageUri,
                        alt: tokenOutDisplay.symbol,
                      }}
                      tokenInProps={{
                        src: tokenInDisplay.imageUri,
                        alt: tokenInDisplay.symbol,
                      }}
                      className="justify-center"
                    />
                  </TableCell>
                  <TableCell>
                    <RatioDisplay
                      inValue={pool.rewardDenominator}
                      outValue={pool.rewardNumerator}
                      inSymbol={tokenInDisplay.symbol}
                      outSymbol={tokenOutDisplay.symbol}
                      equalSign="/"
                    />
                  </TableCell>
                  <TableCell>
                    <MetricNumber
                      number={pool.liquidity}
                      unit={tokenOutDisplay.symbol}
                      isShorten
                    />
                  </TableCell>
                  <TableCell>
                    <NetworkDisplay
                      chainId={pool.chainId}
                      classNames={{
                        container: "flex items-center justify-center gap-3",
                      }}
                    />
                  </TableCell>
                  <TableCell className="w-max max-w-max min-w-max">
                    <Button
                      variant={"swap"}
                      className="sm:text-24px min-w-28 rounded-13px px-6 py-2 font-orbitron text-xl font-semibold sm:min-w-35"
                      hasGroupHover
                    >
                      Swap
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      {isAuthenticated && (
        <div className="flex justify-end">
          <Link
            to="/my-participated-pools"
            search={{
              tab: "swap-pool",
            }}
            className="sm:text-24px pr-3 font-inter text-xl font-semibold"
          >
            See more
          </Link>
        </div>
      )}
    </div>
  );
};

export default SwapRecentPoolsTable;
