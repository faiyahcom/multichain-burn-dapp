import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import CopyableText from "@/components/common/copyable-text";
import CustomPagination from "@/components/common/pagination";
import TableSpinner from "@/components/common/table-spinner";
import NetworkDisplay from "@/components/common/network-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimestampSecondsToDate, truncateString } from "@/utils/helpers/string";
import { networkIdToChainId } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";
import { useAdminTransferHistoryFilterStore } from "@/stores/admin/transfer-history/search-filter-store";
import { type TransferRecord } from "@/services/transferHistoryService";
import { transferHistoryQueryKeys } from "@/services/queries/queryKey";
import { apiClient } from "@/config/axios";

const LIMIT = 10;

// ─── Decimals helper (fallback when API doesn't provide decimals) ──────────────
const SYMBOL_DECIMALS: Record<string, number> = {
  USDT: 6,
  USDC: 6,
  ETH: 18,
  BNB: 18,
  SOL: 9,
  WBTC: 8,
};

// Fallback for filters when token decimals can't be determined (e.g. no token selected)
const DEFAULT_FILTER_DECIMALS = 6;

function formatTokenAmount(amountOut: string, decimals?: number | null, symbol?: string): string {
  const resolvedDecimals = decimals ?? (symbol ? SYMBOL_DECIMALS[symbol] : undefined) ?? 18;
  const value = Number(amountOut) / Math.pow(10, resolvedDecimals);
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

function humanAmountToRawString(amount: string, decimals: number): string {
  const normalized = amount.trim().replace(",", ".");
  if (!normalized) return "";
  const [intPartRaw, fracPartRaw = ""] = normalized.split(".");
  const intPart = (intPartRaw || "0").replace(/^0+(?=\d)/, "") || "0";
  const fracPart = fracPartRaw.slice(0, decimals).padEnd(decimals, "0");
  const digits = `${intPart}${fracPart}`.replace(/^0+(?=\d)/, "") || "0";
  return BigInt(digits).toString();
}

type TransferHistoryApiTxn = {
  id: string;
  hash: string;
  recipient: string | null;
  poolAddress: string;
  poolName: string | null;
  chainId: string;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals?: number;
  amountOut: string;
  timestamp: string; // unix seconds (as string)
  whitelistName: string | null;
  whitelistEmail: string | null;
};

type TransferHistoryApiResponse = {
  page: number;
  total: number;
  txns: TransferHistoryApiTxn[];
};

const AdminTransferHistoryTable = () => {
  const { filter, setFilter } = useAdminTransferHistoryFilterStore();

  // Fall back to the user's connected chain when no network filter is selected
  const { selectedNetworkId } = useSystemStore();
  const resolvedChainId = useMemo(() => {
    const networkId = filter.network || selectedNetworkId;
    return networkIdToChainId(networkId) ?? undefined;
  }, [filter.network, selectedNetworkId]);

  const apiChainId = useMemo(() => {
    if (!resolvedChainId) return undefined;
    return resolvedChainId === "11155111" ? "-1" : resolvedChainId;
  }, [resolvedChainId]);

  const queryParams = useMemo(
    () => ({
      page: filter.page,
      limit: LIMIT,
      chainId: apiChainId,
      tokenOut: filter.tokens.length > 0 ? filter.tokens.join(",") : undefined,
      search: filter.text || undefined,
      amountOutMin: filter.amountMin
        ? humanAmountToRawString(filter.amountMin, filter.tokenOutDecimals ?? DEFAULT_FILTER_DECIMALS)
        : undefined,
      amountOutMax: filter.amountMax
        ? humanAmountToRawString(filter.amountMax, filter.tokenOutDecimals ?? DEFAULT_FILTER_DECIMALS)
        : undefined,
      dateFrom: filter.dateFrom || undefined,
      dateTo: filter.dateTo || undefined,
    }),
    [filter, apiChainId],
  );

  const { data, isPending } = useQuery({
    queryKey: transferHistoryQueryKeys.list(queryParams),
    queryFn: async () => {
      const response = await apiClient.get<TransferHistoryApiResponse>("/whitelist-users/history", {
        params: queryParams,
      });

      const transfers: TransferRecord[] = (response.txns ?? []).map((t) => ({
        poolName: t.poolName,
        chainId: t.chainId,
        tokenOut: t.tokenOut,
        tokenOutSymbol: t.tokenOutSymbol,
        tokenOutDecimals: t.tokenOutDecimals ?? null,
        amountOut: t.amountOut,
        // API returns seconds → convert to milliseconds for table formatter
        timestamp: String(Number(t.timestamp) * 1000),
        whitelistName: t.whitelistName,
        whitelistEmail: t.whitelistEmail,
        recipient: t.recipient,
      }));

      return { page: response.page, total: response.total, transfers };
    },
  });

  const transfers = data?.transfers ?? [];
  const total = data?.total ?? 0;

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
    <div className="space-y-10 pb-10">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner isLoading={isPending} colSpan={columns.length} />
          {transfers.map((item, index) => (
            <TableRow key={index} className="group">
              {/* Recipient — name + email subtitle */}
              <TableCell className="pl-8">
                <div className="flex flex-col items-start text-left">
                  <span className="text-mb-table-text font-medium group-hover:font-bold group-hover:text-active">
                    {item.whitelistName ?? "-"}
                  </span>
                  {item.whitelistEmail && (
                    <span className="text-xs text-foreground! font-normal! group-hover:text-foreground! group-hover:font-normal!">
                      {item.whitelistEmail}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Pool — poolName */}
              <TableCell>{item.poolName ?? "-"}</TableCell>

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
                {formatTokenAmount(item.amountOut, item.tokenOutDecimals, item.tokenOutSymbol)}
              </TableCell>

              {/* Date — timestamp (milliseconds → date) */}
              <TableCell>
                {formatTimestampSecondsToDate({
                  timestamp: String(Math.floor(Number(item.timestamp) / 1000)),
                  notFound: "-",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CustomPagination
        currentPage={filter.page}
        totalCount={total}
        pageSize={LIMIT}
        onPageChange={(page) => setFilter({ page: Number(page) })}
      />
    </div>
  );
};

export default AdminTransferHistoryTable;

