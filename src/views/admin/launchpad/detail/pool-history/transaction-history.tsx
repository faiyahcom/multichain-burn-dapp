import React, { useState } from "react";
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
import { txnKind, type PoolDetailResponse } from "@/types/pool";
import { formatAmount, parseToBN } from "@/utils/helpers/numbers";
import { IconGoTo } from "@/assets/react";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

const launchpadActionLabel = (kind: number): string => {
  switch (kind) {
    case 11:
      return "Deposit";
    case 12:
      return "Deposit & Instant Claim";
    case 13:
      return "Claim";
    case 14:
      return "Receive Reward";
    default:
      return `Kind ${kind}`;
  }
};

const TransactionHistoryTable = ({ poolDetail }: Props) => {
  const [page, setPage] = useState(1);

  const { data: poolTxns, isLoading } = useQuery({
    queryKey: poolQueryKeys.txns(poolDetail?.pool?.address || "", page, ""),
    queryFn: () =>
      poolService.getPoolTxns(
        page,
        DEFAULT_PAGE_SIZE,
        poolDetail?.pool?.address || "",
        Object.keys(txnKind)
          .map((k) => Number(k))
          .filter((k) => ![11,12,13,14].includes(k))
          .join(","),
      ),
    enabled: !!poolDetail?.pool?.address,
    refetchInterval: 2_500,
  });

  const network = poolDetail?.pool?.chainId
    ? chainIdToNetworkConfig(poolDetail.pool.chainId)
    : undefined;

  const saleTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const paymentTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });

  const resolveTokenSymbol = (
    txTokenAddress: string,
    fallbackSymbol: string,
  ) => {
    if (
      txTokenAddress?.toLowerCase() === poolDetail?.pool?.tokenIn?.toLowerCase()
    ) {
      return paymentTokenDisplay.symbol;
    }
    if (
      txTokenAddress?.toLowerCase() ===
      poolDetail?.pool?.rewardToken?.toLowerCase()
    ) {
      return saleTokenDisplay.symbol;
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
              Time
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Action
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Amount
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Fee
            </TableHead>
            <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
              Tx Hash
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
          {txns.map((tx) => {
            const kind = Number(tx.kind);

            const hasAmountIn =
              tx.amountIn != null &&
              tx.amountIn.toString() !== "0" &&
              tx.tokenInDecimals != null;
            const hasAmountOut =
              tx.amountOut != null &&
              tx.amountOut.toString() !== "0" &&
              tx.tokenOutDecimals != null;

            const feeDecimals = hasAmountOut
              ? tx.tokenOutDecimals
              : tx.tokenInDecimals;
            const feeSymbol = hasAmountOut
              ? resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)
              : resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol);
            const fee =
              feeDecimals != null
                ? `${formatAmount(parseToBN(tx.fee || "0").toString(), feeDecimals)} ${feeSymbol}`
                : `0 ${feeSymbol}`;

            const inStr = hasAmountIn
              ? `${formatAmount(tx.amountIn.toString(), tx.tokenInDecimals!)} ${resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol)}`
              : null;
            const outStr = hasAmountOut
              ? `${formatAmount(tx.amountOut.toString(), tx.tokenOutDecimals!)} ${resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)}`
              : null;

            let amountCell: React.ReactNode;
            switch (kind) {
              case 12: // Deposit & Instant Claim
                amountCell = (
                  <span className="inline-flex items-center gap-1">
                    <span>{inStr ?? "—"}</span>
                    <span className="text-greyed">→</span>
                    <span>{outStr ?? "—"}</span>
                  </span>
                );
                break;
              case 11: // Deposit
                amountCell = <span>{inStr ?? "—"}</span>;
                break;
              case 13: // Claim
              case 14: // Receive Reward
                amountCell = <span>{outStr ?? "—"}</span>;
                break;
              default:
                amountCell = <span>{inStr ?? outStr ?? "—"}</span>;
            }

            const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

            return (
              <TableRow key={tx.id} className="text-base text-greyed">
                <TableCell>
                  {tx.executorName ||
                    truncateString({ str: tx.executor, left: 4, right: 4 }) ||
                    "—"}
                </TableCell>
                <TableCell>
                  <CopyableText
                    content={tx.executor}
                    displayText={
                      truncateString({
                        str: tx.executor,
                        left: 4,
                        right: 4,
                      }) || "—"
                    }
                  />
                </TableCell>
                <TableCell>
                  {formatTimestampSecondsToDate({
                    timestamp: tx.timestamp,
                    formatStr: "yyyy/MM/dd HH:mm",
                  })}
                </TableCell>
                <TableCell>{launchpadActionLabel(kind)}</TableCell>
                <TableCell>{amountCell}</TableCell>
                <TableCell>{fee}</TableCell>
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
        onPageChange={(p) => setPage(p)}
      />
    </>
  );
};

export default TransactionHistoryTable;
