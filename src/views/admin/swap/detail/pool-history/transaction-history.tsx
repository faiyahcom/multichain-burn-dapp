import CustomPagination from "@/components/common/pagination";
import CopyableText from "@/components/common/copyable-text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chainIdToNetworkConfig } from "@/config/networks";
import { getExplorerTxUrl } from "@/utils/helpers/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { type PoolDetailResponse } from "@/types/pool";
import { formatAmount, parseToBN } from "@/utils/helpers/numbers";
import { IconGoTo } from "@/assets/react";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

const TransactionHistoryTable = ({ poolDetail }: Props) => {
  const [page, setPage] = useState(1);
  const excludeKinds = [2].join(",");

  const { data: poolTxns, isLoading } = useQuery({
    queryKey: poolQueryKeys.txns(
      poolDetail?.pool?.address || "",
      page,
      excludeKinds,
    ),
    queryFn: () =>
      poolService.getPoolTxns(
        page,
        DEFAULT_PAGE_SIZE,
        poolDetail?.pool?.address || "",
        excludeKinds,
      ),
    enabled: !!poolDetail?.pool?.address,
    refetchInterval: 2_500,
  });

  const network = poolDetail?.pool?.chainId
    ? chainIdToNetworkConfig(poolDetail?.pool?.chainId)
    : undefined;
  const tokenInDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });
  const tokenOutDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const resolveTokenSymbol = (
    txTokenAddress: string,
    fallbackSymbol: string,
  ) => {
    if (
      txTokenAddress?.toLowerCase() === poolDetail?.pool?.tokenIn?.toLowerCase()
    ) {
      return tokenInDisplay.symbol;
    }
    if (
      txTokenAddress?.toLowerCase() ===
      poolDetail?.pool?.rewardToken?.toLowerCase()
    ) {
      return tokenOutDisplay.symbol;
    }
    return fallbackSymbol;
  };

  const txns = poolTxns?.txns ?? [];

  if (isLoading) {
    return (
      <div className="w-full py-8 text-center text-greyed">
        Loading transactions...
      </div>
    );
  }

  if (txns.length === 0) {
    return (
      <div className="w-full py-8 text-center text-greyed">
        No transactions yet
      </div>
    );
  }

  return (
    <>
      <Table className="mb-2 border-spacing-y-0 rounded-b-lg border border-progress-bg">
        <TableHeader>
          <TableRow>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Nickname
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Wallet Address
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Swapped
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Fee
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Time
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Tx Hash
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
          {txns.map((tx) => {
            const hasAmountIn =
              tx.amountIn != null &&
              tx.amountIn.toString() !== "0" &&
              tx.tokenInDecimals != null;
            const hasAmountOut =
              tx.amountOut != null &&
              tx.amountOut.toString() !== "0" &&
              tx.tokenOutDecimals != null;

            // Fee is always on the input side for swap
            const feeRaw = parseToBN(tx.fee);
            const feeDecimals = tx.tokenInDecimals;
            const feeSymbol = resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol);
            const fee =
              feeDecimals != null
                ? `${formatAmount(parseToBN(tx.fee || "0").toString(), feeDecimals)} ${feeSymbol}`
                : `0 ${feeSymbol}`;

            // User's net received on input side = amountIn - fee
            const inNetRaw = hasAmountIn
              ? parseToBN(tx.amountIn).sub(feeRaw).toString()
              : null;
            const inPart =
              inNetRaw != null
                ? `${formatAmount(inNetRaw, tx.tokenInDecimals)} ${resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol)}`
                : `0 ${resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol)}`;
            const outPart = hasAmountOut
              ? `${formatAmount(tx.amountOut, tx.tokenOutDecimals)} ${resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)}`
              : `0 ${resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)}`;
            const swapped = `${inPart} → ${outPart}`;

            const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

            return (
              <TableRow key={tx.id} className="text-base text-greyed">
                <TableCell>
                  {tx.executorName
                    ? tx.executorName
                    : truncateString({ str: tx.executor, left: 4, right: 4 }) ||
                      "—"}
                </TableCell>
                <TableCell>
                  <CopyableText
                    content={tx.executor}
                    displayText={
                      truncateString({ str: tx.executor, left: 4, right: 4 }) ||
                      "—"
                    }
                  />
                </TableCell>
                <TableCell>{swapped}</TableCell>
                <TableCell>{fee}</TableCell>
                <TableCell>
                  {formatTimestampSecondsToDate({
                    timestamp: tx.timestamp,
                    formatStr: "yyyy/MM/dd HH:mm",
                  })}
                </TableCell>
                <TableCell>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5"
                  >
                    {truncateString({ str: tx.hash })}
                    <IconGoTo className="size-3 shrink-0" />
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <CustomPagination
        currentPage={page}
        totalCount={poolTxns?.total || 0}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={(page) => setPage(page)}
      />
    </>
  );
};

export default TransactionHistoryTable;
