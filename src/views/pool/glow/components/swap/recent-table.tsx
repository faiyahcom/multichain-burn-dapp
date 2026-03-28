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
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum } from "@/types/pool";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

const SwapRecentPoolsTable = ({}: {}) => {
  const navigate = useNavigate();
  const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
    queryKey: poolQueryKeys.recents(PoolKindCodeEnum.Swap),
    queryFn: () => poolService.getRecentPools(PoolKindCodeEnum.Swap),
  });

  const columns = ["Pool", "Pair", "Ratio", "Liquidity", "Network", "Action"];
  const fixWidth: React.CSSProperties["minWidth"] = `280px`;

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
                  width: index === 0 ? fixWidth : `${100 / columns.length}%`,
                  minWidth: index === 0 ? fixWidth : "", // 280px for first column
                }}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSkeleton
            colCount={columns.length}
            rowCount={2}
            isLoading={isRecentPoolsPending}
          />
          <TableNoData
            colSpan={columns.length}
            data={recentPools?.pools}
            isLoading={isRecentPoolsPending}
          />
          {recentPools?.pools?.map((pool) => {
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
                className="sm:text-24px cursor-pointer text-xl"
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
                    <IconSwapCategory className="size-10.75" />
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
                          displayText: "text-mb-gray-b8 text-base sm:text-xl",
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
                    number={sciToFormatted(
                      pool.liquidity,
                      pool.tokenOutDecimals,
                    )}
                    unit={tokenOutDisplay.symbol}
                    isShorten
                  />
                </TableCell>
                <TableCell>
                  <NetworkDisplay
                    chainId={pool.chainId}
                    classNames={{
                      container: "flex items-center justify-center gap-3",
                      label: "text-base sm:text-28px",
                    }}
                  />
                </TableCell>
                <TableCell className="max-w-max w-max min-w-max">
                  <Button
                    variant={"swap"}
                    className="sm:text-24px min-w-28 rounded-13px px-6 py-2 font-orbitron text-xl font-semibold sm:min-w-46.5"
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
      <div className="flex justify-end">
        <Link
          to="/swap/"
          className="sm:text-24px font-inter text-xl font-semibold pr-3"
        >
          See more
        </Link>
      </div>
    </div>
  );
};

export default SwapRecentPoolsTable;
