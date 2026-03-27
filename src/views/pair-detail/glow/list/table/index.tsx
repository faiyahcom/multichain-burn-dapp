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
import TableSpinner from "@/components/common/glow/table-spinner";
import MetricNumber from "@/components/common/metric-number";
import RatioDisplay from "@/components/common/ratio-display";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import TokenImage from "@/components/common/token-image";
import { chainIdToNetworkConfig } from "@/config/networks";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const PairDetailGlowListTable: React.FC<Props> = ({ data, isLoading }) => {
  const { filter } = usePairDetailSearchFilterStore();
  const isBurnPool = filter.type === 0;

  const columns = [
    "Pool",
    "Ratio",
    ...(isBurnPool ? ["Time", "Status"] : ["Volume"]),
    "Action",
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              className="h-12 pt-2 align-baseline"
              variant="pair"
            >
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableSpinner isLoading={isLoading} colSpan={columns.length} />
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

          return (
            <TableRow key={pool.address}>
              <TableCell className="text-left">
                <div className="flex min-w-0 items-center gap-3.25">
                  <div className="flex min-w-0 shrink-0 items-center">
                    <TokenImage
                      src={tokenOutDisplay.imageUri}
                      alt={tokenOutDisplay.symbol}
                      classNames={{
                        common: "size-6 sm:size-8",
                      }}
                    />
                    <TokenImage
                      src={tokenInDisplay.imageUri}
                      alt={tokenInDisplay.symbol}
                      classNames={{
                        common: "size-6 sm:size-8 -ml-1",
                      }}
                    />
                  </div>
                  <div>
                    <p className="max-w-full truncate" title={pool.name}>
                      {pool.name}
                    </p>
                    <CopyableText
                      content={pool.address}
                      displayText={truncateString({
                        str: pool.address,
                      })}
                      classNames={{
                        container: "justify-start",
                        displayText: "text-foreground font-normal",
                      }}
                    />
                  </div>
                </div>
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
              {isBurnPool ? (
                <>
                  <TableCell>
                    <StartEndDateDisplay
                      startDate={pool.timeStart}
                      endDate={pool.timeEnd}
                    />
                  </TableCell>
                  <TableCell>
                    <p>{getPoolStatusLabel(pool.status)}</p>
                  </TableCell>
                </>
              ) : (
                <TableCell>
                  <MetricNumber number={pool.volume} isShorten />
                </TableCell>
              )}
              <TableCell>
                <Link
                  to={`/${isBurnPool ? "burn" : "swap"}/detail/${pool.address}`}
                >
                  <Button variant={"pair"} hasHover>
                    View Detail
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PairDetailGlowListTable;
