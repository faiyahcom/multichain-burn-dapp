import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import LaunchpadCategoryIcon from "@/components/common/glow/icon/launchpad-category-icon";
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
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { useAuthStore } from "@/stores/authStore";
import { truncateString } from "@/utils/helpers/string";
import { Link, useNavigate } from "@tanstack/react-router";
import TBDTooltip from "./tbd-tooltip";
import { useQuery } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum } from "@/types/pool";
import { poolService } from "@/services/poolService";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { getPoolStatusLabel } from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import ConnectButton from "@/components/layout/header/connect-button";

const LaunchpadRecentPoolsTable = () => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!user?.address;

  const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
    queryKey: poolQueryKeys.recents({
      user: user?.address,
      poolKind: PoolKindCodeEnum.Launchpad,
    }),
    queryFn: () =>
      poolService.getRecentPools({
        poolKind: PoolKindCodeEnum.Launchpad,
        user: user?.address,
      }),
    enabled: isAuthenticated,
  });

  const columns = [
    "Project",
    "Time",
    "Mode",
    "Pair",
    "Deposited",
    "Received",
    "Network",
    "Status",
  ];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `200px`;

  return (
    <>
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column}
                  variant="launchpad"
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
                const network = chainIdToNetworkConfig(pool?.chainId);

                const tokenInDisplay = resolvePoolTokenDisplay({
                  network,
                  tokenAddress: pool?.tokenIn,
                  tokenSymbol: pool?.tokenInSymbol,
                  tokenName: pool?.tokenInSymbol,
                  customName: pool?.tokenInSymbolCustom ?? undefined,
                  customSymbol: pool?.tokenInSymbolCustom ?? undefined,
                  imageUri: pool?.tokenInImageUri ?? undefined,
                });

                const tokenRewardDisplay = resolvePoolTokenDisplay({
                  network,
                  tokenAddress: pool?.tokenOut,
                  tokenSymbol: pool?.tokenOutSymbol,
                  tokenName: pool?.tokenOutSymbol,
                  customName: pool?.tokenOutSymbolCustom ?? undefined,
                  customSymbol: pool?.tokenOutSymbolCustom ?? undefined,
                  imageUri: pool?.tokenOutImageUri ?? undefined,
                });

                const statusLabel = getPoolStatusLabel(pool?.status);
                const href = `/launchpad/detail/${pool?.address}`;

                const rewardDenominator =
                  Number(pool.rewardDenominator ?? "0") ?? 0;
                const rewardNumerator =
                  Number(pool.rewardNumerator ?? "0") ?? 0;
                // if both rewardDenominator and rewardNumerator are 0, then Dynamic
                const isDynamic =
                  rewardDenominator === 0 && rewardNumerator === 0;

                const depositedAmount = Number(
                  sciToFormatted(
                    pool.depositedAmount ?? "0",
                    pool.tokenInDecimals,
                  ),
                );
                const receivedAmount = Number(
                  sciToFormatted(
                    pool.receivedAmount ?? "0",
                    pool.tokenOutDecimals,
                  ),
                );

                // show TBD if it is dynamic and rewardVisibility is false
                const showTBD = isDynamic && pool?.rewardVisibility === false;

                return (
                  <TableRow
                    key={pool?.address}
                    className="cursor-pointer font-medium"
                    onClick={() => {
                      navigate({
                        to: href,
                      });
                    }}
                    variant="launchpad"
                  >
                    {/* Pool name + address */}
                    <TableCell
                      className="w-(--max-w) min-w-0 text-left"
                      style={
                        {
                          "--max-w": fixWidth,
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                        <LaunchpadCategoryIcon className="size-10.75" />
                        {/* max-w - spacing * (10.75 + 3) */}
                        <div className="max-w-[calc(var(--max-w)-var(--spacing)*13.75)] min-w-0">
                          <p
                            className="max-w-full min-w-0 truncate font-semibold"
                            title={pool?.name}
                          >
                            {pool?.name}
                          </p>
                          <CopyableText
                            content={pool?.address}
                            displayText={truncateString({
                              str: pool?.address,
                            })}
                            classNames={{
                              container: "justify-start",
                              displayText: "text-base sm:text-xl",
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    {/* Time */}
                    <TableCell>
                      <StartEndDateDisplay
                        startDate={pool?.timeStart}
                        endDate={pool?.timeEnd}
                        classNames={{
                          container: "mx-auto w-max",
                        }}
                      />
                    </TableCell>
                    {/* Mode */}
                    <TableCell>{isDynamic ? "Dynamic" : "Fixed"}</TableCell>
                    {/* Pair */}
                    <TableCell>
                      <TokenOutInInterceptDisplay
                        tokenOutProps={{
                          src: tokenRewardDisplay.imageUri,
                          alt: tokenRewardDisplay.symbol,
                        }}
                        tokenInProps={{
                          src: tokenInDisplay.imageUri,
                          alt: tokenInDisplay.symbol,
                        }}
                        className="justify-center"
                      />
                    </TableCell>
                    {/* Deposited */}
                    <TableCell>
                      <MetricNumber
                        number={depositedAmount}
                        unit={tokenInDisplay.symbol}
                        isShorten
                      />
                    </TableCell>
                    {/* Received */}
                    <TableCell>
                      {showTBD ? (
                        <TBDTooltip />
                      ) : (
                        <MetricNumber
                          number={receivedAmount}
                          unit={tokenRewardDisplay.symbol}
                          isShorten
                        />
                      )}
                    </TableCell>
                    {/* Network */}
                    <TableCell>
                      <NetworkDisplay
                        chainId={pool?.chainId}
                        classNames={{
                          container: "flex items-center justify-center gap-3",
                        }}
                      />
                    </TableCell>
                    {/* Status */}
                    <TableCell className="w-max max-w-max min-w-max">
                      <Button
                        variant={"launchpad"}
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
                tab: "launchpad",
              }}
              className="sm:text-24px pr-3 font-inter text-xl font-semibold"
            >
              See more
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default LaunchpadRecentPoolsTable;
