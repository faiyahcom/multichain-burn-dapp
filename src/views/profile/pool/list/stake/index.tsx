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
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: ParticipatedUserPool[];
  isLoading?: boolean;
  limit?: number;
}

const ProfilePoolListStake: React.FC<Props> = ({
  data,
  isLoading,
  limit = 10,
}) => {
  const navigate = useNavigate();

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

  return (
    <Table className="sm:text-2xl">
      <TableHeader className="sm:text-2xl">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              variant="pair"
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

          const apr = Number(pool.apr ?? 0) / 10000;

          return (
            <TableRow
              key={pool.address}
              className={"cursor-pointer"}
              onClick={() => {
                navigate({
                  to: `/staking/detail/$address`,
                  params: {
                    address: pool.address,
                  },
                });
              }}
              variant="pair"
            >
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
                <TokenOutInInterceptDisplay
                  tokenOutProps={{
                    src: tokenOutDisplay.imageUri,
                    alt: tokenOutDisplay.symbol,
                    classNames: {
                      common: "sm:size-7 z-0",
                    },
                  }}
                  tokenInProps={{
                    src: tokenInDisplay.imageUri,
                    alt: tokenInDisplay.symbol,
                    classNames: {
                      common: "sm:size-7 sm:-ml-[9px] z-10",
                    },
                  }}
                  className="justify-center"
                />
              </TableCell>
              <TableCell>
                <MetricNumber
                  number={pool.stakedAmount}
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
                  chainId={pool.chainId}
                  classNames={{
                    container: "flex items-center justify-center gap-3",
                  }}
                />
              </TableCell>
              <TableCell className="w-max max-w-max min-w-max">
                <Button
                  variant={"pair"}
                  hasGroupHover
                  className="sm:text-24px min-w-full rounded-13px px-6 py-2 font-orbitron text-xl font-semibold"
                >
                  {getPoolStatusLabel(pool.status)}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ProfilePoolListStake;
