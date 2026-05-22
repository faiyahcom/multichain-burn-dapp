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
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { ParticipatedUserPool } from "@/services/userService";
import { getPoolStatusLabel } from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import TBDTooltip from "@/views/pool/glow/components/launchpad/tbd-tooltip";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: ParticipatedUserPool[];
  isLoading?: boolean;
  limit?: number;
}

const ProfilePoolListLaunchpad: React.FC<Props> = ({
  data,
  isLoading,
  limit = 10,
}) => {
  const navigate = useNavigate();

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

  return (
    <Table className="sm:text-2xl">
      <TableHeader className="sm:text-2xl">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              variant="launchpad"
              style={{
                width: cellWidth,
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
          rowCount={limit}
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

          const rewardDenominator = Number(pool.rewardDenominator ?? "0") || 0;
          const rewardNumerator = Number(pool.rewardNumerator ?? "0") || 0;
          // if both rewardDenominator and rewardNumerator are 0, then Dynamic
          const isDynamic = rewardDenominator === 0 && rewardNumerator === 0;

          const depositedAmount = Number(
            sciToFormatted(pool.depositedAmount ?? "0", pool.tokenInDecimals),
          );
          const receivedAmount = Number(
            sciToFormatted(pool.receivedAmount ?? "0", pool.tokenOutDecimals),
          );

          // show TBD if it is dynamic and rewardVisibility is false and status is not ended or completed
          const showTBD =
            isDynamic &&
            pool.rewardVisibility === false &&
            pool.status !== "ended" &&
            pool.status !== "completed";

          return (
            <TableRow
              key={pool.address}
              className="cursor-pointer"
              onClick={() => {
                navigate({
                  to: href,
                });
              }}
              variant="launchpad"
            >
              {/* Pool name + address */}
              <TableCell className="min-w-0 space-y-1 text-left">
                <p className="max-w-38.75 min-w-0 truncate" title={pool.name}>
                  {pool.name}
                </p>
                <CopyableText
                  content={pool.address}
                  displayText={truncateString({
                    str: pool.address,
                  })}
                  classNames={{
                    container: "justify-start",
                  }}
                />
              </TableCell>
              {/* Time */}
              <TableCell>
                <StartEndDateDisplay
                  startDate={pool.timeStart}
                  endDate={pool.timeEnd}
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
                    unit={tokenOutDisplay.symbol}
                    isShorten
                  />
                )}
              </TableCell>
              {/* Network */}
              <TableCell>
                <NetworkDisplay
                  chainId={pool.chainId}
                  classNames={{
                    container: "flex items-center justify-center gap-3",
                  }}
                />
              </TableCell>
              {/* Status */}
              <TableCell className="w-max max-w-max min-w-max">
                <Button
                  variant={"pair"}
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

export default ProfilePoolListLaunchpad;
