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

const BurnPoolListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  const columns = ["Pool", "Time", "Pair", "Liquidity", "Network", "Ratio", "Status"];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              variant="burn"
              style={{ width: cellWidth }}
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
          const isLive = pool.status === "on_going";
          const href = `/burn/detail/${pool.address}`;

          return (
            <TableRow
              key={pool.address}
              onClick={() => navigate({ to: href })}
              className="sm:text-24px cursor-pointer text-xl"
              variant="burn"
            >
              <TableCell className="text-left">
                <div className="flex min-w-0 items-center gap-3">
                  <IconBurnCategory className="size-10.75" />
                  <div className="min-w-0">
                    <p
                      className="sm:text-24px truncate text-xl font-semibold"
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
                <StartEndDateDisplay
                  startDate={pool.timeStart}
                  endDate={pool.timeEnd}
                  classNames={{
                    container: "mx-auto w-max text-xl sm:text-24px",
                  }}
                />
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
                <MetricNumber
                  number={sciToFormatted(pool.liquidity, pool.tokenOutDecimals)}
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
              <TableCell>
                <span className="sm:text-24px text-xl">Dynamic</span>
              </TableCell>
              <TableCell>
                <Button
                  variant={isLive ? "burn" : "burn-active"}
                  hasGroupHover
                  className="sm:text-24px min-w-28 rounded-13px px-6 py-2 font-orbitron text-xl font-semibold sm:min-w-35"
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

export default BurnPoolListTable;
