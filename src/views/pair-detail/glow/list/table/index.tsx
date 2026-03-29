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
import RatioDisplay from "@/components/common/ratio-display";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
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

const PairDetailGlowListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const { filter } = usePairDetailSearchFilterStore();
  const isBurnPool = filter.type === 0;

  const columns = [
    "Pool",
    "Volume",
    "Ratio",
    ...(isBurnPool ? ["Time", "Status"] : []),
    "Action",
  ];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `350px`;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={column}
              className="h-12 pt-2 align-baseline"
              variant="pair"
              style={{
                width: index === 0 ? fixWidth : cellWidth, // 350px for first column
                minWidth: index === 0 ? fixWidth : "", // 350px for first column
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

          const href = `/${isBurnPool ? "burn" : "swap"}/detail/${pool.address}`;

          return (
            <TableRow
              key={pool.address}
              className={"cursor-pointer"}
              onClick={() => {
                navigate({
                  to: href,
                });
              }}
              variant="pair"
            >
              <TableCell
                style={
                  {
                    "--max-w": fixWidth,
                  } as React.CSSProperties
                }
                className="w-(--max-w) min-w-0"
              >
                <div className="flex min-w-0 items-center gap-3.25">
                  <TokenOutInInterceptDisplay
                    tokenOutProps={{
                      src: tokenOutDisplay.imageUri,
                      alt: tokenOutDisplay.symbol,
                    }}
                    tokenInProps={{
                      src: tokenInDisplay.imageUri,
                      alt: tokenInDisplay.symbol,
                    }}
                  />
                  {/* max-w - 60px - 13px = max-w - 73px (18.25) */}
                  <div className="max-w-[calc(var(--max-w)-var(--spacing)*18.25)] min-w-0 text-left">
                    <p className="min-w-0 truncate" title={pool.name}>
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
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <MetricNumber number={pool.volume} isShorten />
              </TableCell>
              <TableCell>
                {isBurnPool ? (
                  <p>Dynamic</p>
                ) : (
                  <RatioDisplay
                    inValue={pool.rewardDenominator}
                    outValue={pool.rewardNumerator}
                    inSymbol={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                    outSymbol={pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                  />
                )}
              </TableCell>
              {isBurnPool && (
                <>
                  <TableCell>
                    <StartEndDateDisplay
                      startDate={pool.timeStart}
                      endDate={pool.timeEnd}
                      classNames={{
                        container: "w-max mx-auto",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <p>{getPoolStatusLabel(pool.status)}</p>
                  </TableCell>
                </>
              )}
              <TableCell>
                <Button
                  variant={"swap"}
                  hasGroupHover
                  className="font-orbitron"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PairDetailGlowListTable;
