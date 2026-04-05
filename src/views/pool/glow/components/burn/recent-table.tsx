import { IconBurnCategory } from "@/assets/react";
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
import NetworkDisplay from "@/components/common/network-display";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import TokenDisplay from "@/components/common/token-display";
import ConnectButton from "@/components/layout/header/connect-button";
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { getPoolStatusLabel } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

const BurnRecentPoolsTable = ({}: {}) => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!user?.address;

  const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
    queryKey: poolQueryKeys.recents({
      user: user?.address,
      poolKind: PoolKindCodeEnum.Burn,
    }),
    queryFn: () =>
      poolService.getRecentPools({
        poolKind: PoolKindCodeEnum.Burn,
        user: user?.address,
      }),
    enabled: isAuthenticated,
  });

  const columns = [
    "Pool",
    "Time",
    "Burn",
    "Reward",
    "Network",
    "Ratio",
    "Status",
  ];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `220px`;

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={column}
                variant="burn"
                className="h-12 pt-2 align-baseline"
                style={{
                  width: index === 0 ? fixWidth : cellWidth, // 220px for first column
                  minWidth: index === 0 ? fixWidth : "", // 220px for first column
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
              const burnTokenDisplay = resolvePoolTokenDisplay({
                network,
                tokenAddress: pool.tokenIn,
                tokenSymbol: pool.tokenInSymbol,
                tokenName: pool.tokenInSymbol,
                customName: pool.tokenInSymbolCustom ?? undefined,
                customSymbol: pool.tokenInSymbolCustom ?? undefined,
                imageUri: pool.tokenInImageUri ?? undefined,
              });
              const rewardTokenDisplay = resolvePoolTokenDisplay({
                network,
                tokenAddress: pool.tokenOut,
                tokenSymbol: pool.tokenOutSymbol,
                tokenName: pool.tokenOutSymbol,
                customName: pool.tokenOutSymbolCustom ?? undefined,
                customSymbol: pool.tokenOutSymbolCustom ?? undefined,
                imageUri: pool.tokenOutImageUri ?? undefined,
              });
              const statusLabel = getPoolStatusLabel(pool.status);
              const href = `/burn/detail/${pool.address}`;

              return (
                <TableRow
                  key={pool.address}
                  variant="burn"
                  className="cursor-pointer font-medium"
                  onClick={() => navigate({ to: href })}
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
                      <IconBurnCategory className="size-10.75 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold" title={pool.name}>
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
                    <StartEndDateDisplay
                      startDate={pool.timeStart}
                      endDate={pool.timeEnd}
                      classNames={{
                        container: "mx-auto w-max",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TokenDisplay
                      symbol={burnTokenDisplay.symbol}
                      imageUri={burnTokenDisplay.imageUri}
                      classNames={{
                        img: "size-6 sm:size-8",
                        container: "gap-3",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TokenDisplay
                      symbol={rewardTokenDisplay.symbol}
                      imageUri={rewardTokenDisplay.imageUri}
                      classNames={{
                        img: "size-6 sm:size-8",
                        container: "gap-3",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <NetworkDisplay
                      chainId={pool.chainId}
                      classNames={{
                        container: "flex items-center justify-center gap-3",
                        img: "mr-0",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <span>Dynamic</span>
                  </TableCell>
                  <TableCell className="w-max max-w-max min-w-max">
                    <Button
                      variant={"burn"}
                      hasGroupHover
                      className="sm:text-24px min-w-full rounded-13px px-6 py-2 font-orbitron text-xl font-semibold"
                    >
                      {statusLabel}
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
              tab: "burn-pool",
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

export default BurnRecentPoolsTable;
