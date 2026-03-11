import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import MetricNumber from "@/components/common/metric-number";
import RatioDisplay from "@/components/common/ratio-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const PairDetailDetailListListLayout: React.FC<Props> = ({
  data,
  isLoading,
}) => {
  const { filter } = usePairDetailSearchFilterStore();
  const isBurnPool = filter.type === 0;

  const columns = [
    "Pool",
    ...(isBurnPool ? ["Time"] : ["Ratio"]), // Burn pool show time, swap pool show ratio
    "Volume",
    "TVL",
    "Status",
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column} className="h-12 pt-2 align-baseline">
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
          const timeStart = formatTimestampSecondsToDate({
            timestamp: pool.timeStart,
            notFound: "",
          });
          const timeEnd = formatTimestampSecondsToDate({
            timestamp: pool.timeEnd,
            notFound: "",
          });

          return (
            <TableRow key={pool.address}>
              <TableCell className="pl-6.75 text-left">
                <Link
                  to={`/${isBurnPool ? "burn" : "swap"}/detail/${pool.address}`}
                  className="block max-w-full truncate"
                  title={pool.name}
                >
                  {pool.name}
                </Link>
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
              </TableCell>
              <TableCell>
                {isBurnPool ? (
                  timeStart &&
                  timeEnd && (
                    <div className="flex flex-col items-center justify-center gap-0.5 2xl:flex-row">
                      <span>{timeStart}</span>
                      <span className="hidden 2xl:block">-</span>
                      <span>{timeEnd}</span>
                    </div>
                  )
                ) : (
                  <RatioDisplay
                    inValue={pool.rewardDenominator}
                    outValue={pool.rewardNumerator}
                    inSymbol={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                    outSymbol={pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                  />
                )}
              </TableCell>
              <TableCell>
                <MetricNumber
                  number={sciToFormatted(
                    pool.volume ?? 0,
                    pool.tokenInDecimals,
                  )}
                  unit={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                />
              </TableCell>
              <TableCell>
                <MetricNumber
                  number={sciToFormatted(pool.tvl ?? 0, pool.tokenOutDecimals)}
                  unit={pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                />
              </TableCell>
              <TableCell>
                <AnimateIconButton
                  variant="letter-icon"
                  iconLetter={getPoolStatusLabel(pool.status).slice(0, 1)}
                  textVariant="text-container-center"
                  hasGroupHover
                  color={getPoolStatusColor(pool.status)}
                  text={getPoolStatusLabel(pool.status)}
                  classNames={{
                    btn: "w-full",
                  }}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PairDetailDetailListListLayout;
