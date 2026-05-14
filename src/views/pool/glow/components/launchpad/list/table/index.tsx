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
import { chainIdToNetworkConfig } from "@/config/networks";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const LaunchpadPoolListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  const columns = [
    "Project",
    "Time",
    "Mode",
    "Pair",
    "Price",
    "Raised",
    "Network",
    "Status",
  ];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `200px`;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              variant="launchpad"
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
        <TableSkeleton
          colCount={columns.length}
          rowCount={12}
          isLoading={isLoading}
        />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        />

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

          const statusLabel = getPoolStatusLabel(pool.status);
          const href = `/launchpad/detail/${pool.address}`;

          const rewardDenominator = Number(pool.rewardDenominator ?? "0") ?? 0;
          const rewardNumerator = Number(pool.rewardNumerator ?? "0") ?? 0;
          // if both rewardDenominator and rewardNumerator are 0, then Dynamic
          const isDynamic = rewardDenominator === 0 && rewardNumerator === 0;
          const price =
            rewardNumerator !== 0 ? rewardDenominator / rewardNumerator : 0;

          const totalRaise = Number(
            sciToFormatted(pool.totalRaise ?? "0", pool.tokenInDecimals),
          );
          const rewardAmount = Number(
            sciToFormatted(pool.rewardAmount ?? "0", pool.tokenOutDecimals),
          );
          const percentRaised =
            rewardAmount !== 0 ? (totalRaise / rewardAmount) * 100 : null;

          return (
            <TableRow
              key={pool.address}
              variant="launchpad"
              className="cursor-pointer font-medium"
              onClick={() => navigate({ to: href })}
            >
              {/* Pool Name + Address */}
              <TableCell
                className="w-(--max-w) min-w-0 text-left"
                style={
                  {
                    "--max-w": fixWidth,
                  } as React.CSSProperties
                }
              >
                <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                  <LaunchpadCategoryIcon className="size-10.5 shrink-0" />
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
                      displayText={truncateString({
                        str: pool.address,
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
              {/* Price */}
              <TableCell>
                {isDynamic ? (
                  "Dynamic"
                ) : (
                  <MetricNumber number={price} unit={"USDT"} isShorten />
                )}
              </TableCell>
              {/* Raised */}
              <TableCell>
                <span>
                  <span>Raised: </span>
                  <MetricNumber
                    classNames={{ container: "inline-flex w-max" }}
                    number={totalRaise}
                    isShorten
                  />
                  {!isDynamic && (
                    <>
                      /
                      <MetricNumber
                        classNames={{ container: "inline-flex w-max" }}
                        number={rewardAmount}
                        isShorten
                      />{" "}
                      {percentRaised !== null && (
                        <>
                          (
                          <MetricNumber
                            classNames={{
                              container: "inline-flex w-max gap-0",
                            }}
                            number={percentRaised}
                            unit="%"
                            isShorten
                          />
                          )
                        </>
                      )}
                    </>
                  )}
                </span>
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
  );
};

export default LaunchpadPoolListTable;
