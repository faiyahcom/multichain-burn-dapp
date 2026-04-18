import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import StakeCategoryIcon from "@/components/common/glow/icon/stake-category-icon";
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
import ConnectButton from "@/components/layout/header/connect-button";
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import { getPoolStatusLabel } from "@/types/admin/master-pool-management";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

const StakeRecentPoolsTable = ({}: {}) => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!user?.address;

  const { data: recentPools, isPending: isRecentPoolsPending } = useQuery({
    queryKey: poolQueryKeys.myStakes("", 1, 2),
    queryFn: () => poolService.getMyStakes(undefined, 1, 2),
    enabled: isAuthenticated,
  });

  const columns = [
    "Pool",
    "Time",
    "Token",
    "Staked Amount",
    "APR",
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
                  variant="stake"
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
                data={recentPools?.snapshots}
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
              recentPools?.snapshots?.map((snapshot) => {
                const network = chainIdToNetworkConfig(snapshot?.pool?.chainId);

                const tokenInDisplay = resolvePoolTokenDisplay({
                  network,
                  tokenAddress: snapshot?.pool?.tokenIn,
                  tokenSymbol: snapshot?.pool?.tokenInSymbol,
                  tokenName: snapshot?.pool?.tokenInSymbol,
                  customName: snapshot?.customSymbolStake,
                  customSymbol: snapshot?.customSymbolStake,
                  imageUri: snapshot?.imageUriStake,
                });

                const tokenRewardDisplay = resolvePoolTokenDisplay({
                  network,
                  tokenAddress: snapshot?.pool?.rewardToken,
                  tokenSymbol: snapshot?.pool?.rewardTokenSymbol,
                  tokenName: snapshot?.pool?.rewardTokenSymbol,
                  customName: snapshot?.customSymbolReward,
                  customSymbol: snapshot?.customSymbolReward,
                  imageUri: snapshot?.imageUriReward,
                });

                const apr = Number(snapshot?.pool?.apr ?? 0) / 10000;
                const statusLabel = getPoolStatusLabel(snapshot?.pool?.status);

                const href = `/staking/detail/${snapshot?.poolAdress}`;

                return (
                  <TableRow
                    key={snapshot?.poolAdress}
                    className="cursor-pointer font-medium"
                    onClick={() => {
                      navigate({
                        to: href,
                      });
                    }}
                    variant="stake"
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
                        <StakeCategoryIcon className="size-10.75 shrink-0" />
                        {/* max-w - spacing * (10.75 + 3) */}
                        <div className="max-w-[calc(var(--max-w)-var(--spacing)*13.75)] min-w-0">
                          <p
                            className="max-w-full min-w-0 truncate font-semibold"
                            title={snapshot?.pool?.name}
                          >
                            {snapshot?.pool?.name}
                          </p>
                          <CopyableText
                            content={snapshot?.poolAdress}
                            displayText={truncateString({
                              str: snapshot?.poolAdress,
                            })}
                            classNames={{
                              container: "justify-start",
                              displayText: "text-base sm:text-xl",
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StartEndDateDisplay
                        startDate={snapshot?.pool?.timeStart}
                        endDate={snapshot?.pool?.timeEnd}
                        classNames={{
                          container: "mx-auto w-max",
                        }}
                      />
                    </TableCell>
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
                    <TableCell>
                      <MetricNumber
                        number={snapshot?.stakingAmount ?? 0}
                        unit={tokenInDisplay.symbol}
                        isShorten
                      />
                    </TableCell>
                    <TableCell>
                      <MetricNumber
                        number={apr}
                        unit="%"
                        isShorten
                        classNames={{
                          container: "gap-0",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <NetworkDisplay
                        chainId={snapshot?.pool?.chainId}
                        classNames={{
                          container: "flex items-center justify-center gap-3",
                        }}
                      />
                    </TableCell>
                    <TableCell className="w-max max-w-max min-w-max">
                      <Button
                        variant={"stake"}
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
                tab: "stake-pool",
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

export default StakeRecentPoolsTable;
