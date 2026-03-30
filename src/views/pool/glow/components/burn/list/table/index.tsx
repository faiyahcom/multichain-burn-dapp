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
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const BurnPoolListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  const columns = [
    "Pool",
    "Time",
    "Pair",
    "Liquidity",
    "Network",
    "Ratio",
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
              variant="burn"
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
          const href = `/burn/detail/${pool.address}`;

          return (
            <TableRow
              key={pool.address}
              onClick={() => navigate({ to: href })}
              className="cursor-pointer font-medium"
              variant="burn"
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
              <TableCell>
                <span>Dynamic</span>
              </TableCell>
              <TableCell>
                <Button
                  variant={"burn"}
                  hasGroupHover
                  className="sm:text-24px min-w-28 rounded-13px px-6 py-2 font-orbitron text-xl font-semibold sm:min-w-46.5"
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
