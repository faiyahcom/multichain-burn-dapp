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

const LIMIT = 20;

// ─── Decimals helper (used until API provides tokenOutDecimals) ────────────────
const SYMBOL_DECIMALS: Record<string, number> = {
  USDT: 6,
  USDC: 6,
  ETH: 18,
  BNB: 18,
  SOL: 9,
  WBTC: 8,
};

function formatTokenAmount(amountOut: string, symbol: string): string {
  const decimals = SYMBOL_DECIMALS[symbol] ?? 18;
  const value = Number(amountOut) / Math.pow(10, decimals);
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 4 });
}

// ─── Mock data matching actual API response ────────────────────────────────────
const MOCK_TRANSFERS: TransferRecord[] = [
  {
    poolName: "Pool 1",
    chainId: "11155111",
    tokenOut: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tokenOutSymbol: "USDT",
    amountOut: "12000000",
    timestamp: "1709850000000",
    whitelistName: "Alice Nguyen",
    whitelistEmail: "alice@example.com",
    recipient: "0xaD45bF9e923aFC5e76800B47C0D5d2F2C8A82e10",
  },
  {
    poolName: "Pool 2",
    chainId: "11155111",
    tokenOut: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenOutSymbol: "USDC",
    amountOut: "5000000",
    timestamp: "1709950000000",
    whitelistName: "Bob Tran",
    whitelistEmail: "bob@example.com",
    recipient: "0xaD45bF9e923aFC5e76800B47C0D5d2F2C8A82e10",
  },
  {
    poolName: "Pool 3",
    chainId: "11155111",
    tokenOut: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    tokenOutSymbol: "ETH",
    amountOut: "500000000000000000",
    timestamp: "1710050000000",
    whitelistName: "Charlie Vo",
    whitelistEmail: "charlie@example.com",
    recipient: "0xaD45bF9e923aFC5e76800B47C0D5d2F2C8A82e10",
  },
  {
    poolName: "Pool 4",
    chainId: "11155111",
    tokenOut: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    tokenOutSymbol: "USDT",
    amountOut: "8500000",
    timestamp: "1710150000000",
    whitelistName: "Diana Le",
    whitelistEmail: "diana@example.com",
    recipient: "0xaD45bF9e923aFC5e76800B47C0D5d2F2C8A82e10",
  },
  {
    poolName: "Pool 5",
    chainId: "11155111",
    tokenOut: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    tokenOutSymbol: "USDC",
    amountOut: "22000000",
    timestamp: "1710250000000",
    whitelistName: "Ethan Pham",
    whitelistEmail: "ethan@example.com",
    recipient: "0xaD45bF9e923aFC5e76800B47C0D5d2F2C8A82e10",
  },
];

const AdminTransferHistoryTable = () => {
  const { filter, setFilter } = useAdminTransferHistoryFilterStore();

  // Fall back to the user's connected chain when no network filter is selected
  const { selectedNetworkId } = useSystemStore();
  const resolvedChainId = useMemo(() => {
    const networkId = filter.network || selectedNetworkId;
    return networkIdToChainId(networkId) ?? undefined;
  }, [filter.network, selectedNetworkId]);

  const queryParams = useMemo(
    () => ({
      page: filter.page,
      limit: LIMIT,
      chainIds: resolvedChainId,
      tokens: filter.tokens.length > 0 ? filter.tokens.join(",") : undefined,
      search: filter.text || undefined,
      amountMin: filter.amountMin || undefined,
      amountMax: filter.amountMax || undefined,
      dateFrom: filter.dateFrom || undefined,
      dateTo: filter.dateTo || undefined,
    }),
    [filter, resolvedChainId],
  );

  // TODO: replace queryFn with real API call when endpoint is available
  const { data, isPending } = useQuery({
    queryKey: transferHistoryQueryKeys.list(queryParams),
    queryFn: async () => {
      // Simulate a small network delay for realism
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        transfers: MOCK_TRANSFERS,
        total: MOCK_TRANSFERS.length,
        page: filter.page,
      };
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
                  <span className="text-[var(--mb-table-text)] font-medium group-hover:font-bold group-hover:text-[var(--active)]">
                    {item.whitelistName ?? "-"}
                  </span>
                  {item.whitelistEmail && (
                    <span className="text-xs !text-[var(--foreground)] !font-normal group-hover:!text-[var(--foreground)] group-hover:!font-normal">
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
                {formatTokenAmount(item.amountOut, item.tokenOutSymbol)}
              </TableCell>

              {/* Date — timestamp (milliseconds → date) */}
              <TableCell>
                {formatTimestampSecondsToDate({
                  // API returns ms → convert to seconds for the formatter
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
