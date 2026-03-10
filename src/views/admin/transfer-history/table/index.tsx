import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
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
import { networkIdToChainId } from "@/config/networks";
import { whitelistUserQueryKeys } from "@/services/queries/queryKey";
import { whitelistUserService } from "@/services/whitelistUserService";
import { useAdminTransferHistoryFilterStore } from "@/stores/admin/transfer-history/search-filter-store-v2";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { sciToFormatted } from "@/utils/helpers/numbers";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";

const AdminTransferHistoryTable = () => {
  const { filter, setFilter } = useAdminTransferHistoryFilterStore();
  const limit = 10;

  const { data: transfers, isPending: isPendingTransfers } = useQuery({
    queryKey: whitelistUserQueryKeys.history(filter),
    queryFn: async () => {
      return whitelistUserService.getTransferHistory({
        page: filter.page,
        limit: limit,
        search: filter.text || undefined,
        chainId: networkIdToChainId(filter.networkId),
        tokenOut: convertArrayToStringParam({ array: filter.tokens }),
        dateFrom: filter.dateFrom
          ? filter.dateFrom.getTime() / 1000
          : undefined,
        dateTo: filter.dateTo ? filter.dateTo.getTime() / 1000 : undefined,
        amountOutMin:
          filter.amountOutMin !== "" ? filter.amountOutMin : undefined,
        amountOutMax:
          filter.amountOutMax !== "" ? filter.amountOutMax : undefined,
      });
    },
  });

  const columns = [
    "Recipient",
    "Pool",
    "Wallet Address",
    "Network",
    "Token Address",
    "Symbol",
    "Amount",
    "Date",
  ];

  return (
    <div className="space-y-10 pb-10 pl-3.75">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner
            isLoading={isPendingTransfers}
            colSpan={columns.length}
          />
          <TableNoData
            data={transfers?.txns}
            isLoading={isPendingTransfers}
            colSpan={columns.length}
          />
          {transfers?.txns?.map((item, index) => (
            <TableRow key={index} className="group">
              {/* Recipient — name + email subtitle */}
              <TableCell className="pl-8">
                <div className="flex max-w-full flex-col items-start text-left">
                  <span
                    className="block max-w-full truncate font-medium text-mb-table-text group-hover:font-bold group-hover:text-active"
                    title={item.whitelistName ?? "-"}
                  >
                    {item.whitelistName ?? "-"}
                  </span>
                  {item.whitelistEmail && (
                    <span
                      className="block max-w-full truncate text-xs font-normal! text-foreground! group-hover:font-normal! group-hover:text-foreground!"
                      title={item.whitelistEmail}
                    >
                      {item.whitelistEmail}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Pool — poolName */}
              <TableCell>
                <p className="max-w-full truncate">{item.poolName ?? "-"}</p>
              </TableCell>

              {/* Wallet Address (recipient from API) */}
              <TableCell>
                {item.recipient ? (
                  <CopyableText
                    content={item.recipient}
                    displayText={truncateString({ str: item.recipient })}
                  />
                ) : (
                  "-"
                )}
              </TableCell>

              {/* Network — chainId */}
              <TableCell>
                <NetworkDisplay chainId={item.chainId} />
              </TableCell>

              {/* Token Address — tokenOut */}
              <TableCell>
                <CopyableText
                  content={item.tokenOut}
                  displayText={truncateString({ str: item.tokenOut })}
                />
              </TableCell>

              {/* Symbol — tokenOutSymbol */}
              <TableCell>{item.tokenOutSymbol}</TableCell>

              {/* Amount — amountOut formatted */}
              <TableCell className="font-medium">
                {sciToFormatted(item.amountOut, item.tokenOutDecimals ?? 0)}
              </TableCell>

              {/* Date — timestamp (milliseconds → date) */}
              <TableCell>
                {formatTimestampSecondsToDate({
                  timestamp: item.timestamp,
                  notFound: "-",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CustomPagination
        currentPage={filter.page}
        totalCount={transfers?.total ?? 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page: Number(page) })}
      />
    </div>
  );
};

export default AdminTransferHistoryTable;
