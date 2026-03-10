import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import InfoTooltip from "@/components/common/info-tooltip";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import TokenImage from "@/components/common/token-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { usePoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  userHiddenBurnPoolStatuses,
  userHiddenSwapPoolStatuses,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { sciToFormatted } from "@/utils/helpers/numbers";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

interface Props {
  poolType: PoolType;
}

const PoolListTable: React.FC<Props> = ({ poolType }) => {
  const isBurnPool = poolType === 0;
  const { filter, setFilter } = usePoolListSearchFilterStore(poolType);
  const limit = 10;

  const { data: burnPoolList, isPending: isBurnPoolListPending } = useQuery({
    queryKey: poolQueryKeys.list({
      type: poolType,
      ...filter,
    }),
    queryFn: async () => {
      return poolService.getPoolList({
        page: filter.page,
        limit: limit,
        chainIds: convertArrayToStringParam({
          array: filter.network?.map((network) => networkIdToChainId(network)),
        }),
        excludeStatuses: convertArrayToStringParam({
          array: [
            ...(isBurnPool
              ? userHiddenBurnPoolStatuses
              : userHiddenSwapPoolStatuses),
          ],
        }),
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        kind: poolType.toString(),
        search: filter.text || undefined,
        sortBy: filter.sortBy,
        sortDirection: filter.sortOrder,
      });
    },
  });

  const columns = [
    {
      name: "Pool",
    },
    {
      name: isBurnPool ? "Time" : "Ratio",
    },
    ...(isBurnPool
      ? [
          {
            name: "Burn",
          },
          {
            name: "Reward",
          },
        ]
      : []),
    {
      name: "Network",
    },
    {
      name: isBurnPool ? "TVL" : "TVL/Budget",
      tip: isBurnPool ? (
        <InfoTooltip content="The total amount of reward token deposited by maker when create Burn Pool" />
      ) : (
        <></>
      ),
    },
    ...(isBurnPool
      ? [
          {
            name: "Ratio",
          },
          {
            name: "Status",
          },
        ]
      : [
          {
            name: "Join",
          },
        ]),
  ];

  return (
    <div className="space-y-9.5 pb-10 pl-13.25">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className="space-x-1">
                <span>{column.name}</span>
                {column.tip}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner
            colSpan={columns.length}
            isLoading={isBurnPoolListPending}
          />
          <TableNoData
            colSpan={columns.length}
            data={burnPoolList?.pools}
            isLoading={isBurnPoolListPending}
          />
          {burnPoolList?.pools.map((pool) => {
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
                <TableCell className="pl-7.25 text-left">
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
                    <>
                      <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5">
                        <MetricNumber
                          number={pool.rewardDenominator}
                          unit={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                          classNames={{
                            container: "max-w-max",
                          }}
                        />
                        <span>{" = "}</span>
                        <MetricNumber
                          number={pool.rewardNumerator}
                          unit={
                            pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol
                          }
                          classNames={{
                            container: "max-w-max",
                          }}
                        />
                      </div>
                    </>
                  )}
                </TableCell>
                {isBurnPool && (
                  <>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <TokenImage
                          src={pool.tokenInImageUri}
                          alt={pool.tokenInSymbol}
                          classNames={{
                            common: "size-4.25",
                          }}
                        />
                        <span>
                          {pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <TokenImage
                          src={pool.tokenOutImageUri}
                          alt={pool.tokenOutSymbol}
                          classNames={{
                            common: "size-4.25",
                          }}
                        />
                        <span>
                          {pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                        </span>
                      </div>
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <NetworkDisplay chainId={pool.chainId} />
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(
                      pool.tvl ?? 0,
                      pool.tokenOutDecimals,
                    )}
                    unit={pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                  />
                </TableCell>
                {isBurnPool ? (
                  <>
                    <TableCell>
                      {/* TODO: might need to change later */}
                      Dynamic
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
                          btn: "min-w-33 mx-auto",
                        }}
                      />
                    </TableCell>
                  </>
                ) : (
                  <TableCell>
                    <Link
                      to={`/swap/detail/${pool.address}`}
                      className="mx-auto block max-w-max"
                    >
                      <AnimateIconButton
                        variant="letter-icon"
                        textVariant="text-container-center"
                        iconLetter="P"
                        hasGroupHover
                        color="#6E37FF"
                        text="Swap"
                        classNames={{
                          btn: "after:text-primary-foreground min-w-20.5",
                        }}
                      />
                    </Link>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <CustomPagination
        currentPage={filter.page}
        totalCount={burnPoolList?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
};

export default PoolListTable;
