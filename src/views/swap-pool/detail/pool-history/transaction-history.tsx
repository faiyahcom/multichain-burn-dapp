import CustomPagination from "@/components/common/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { txnKind, type PoolDetailResponse } from "@/types/pool";
import { getExplorerTxUrl } from "@/utils/helpers/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// const TX_KIND_LABELS: Record<number, string> = {
//     0: "Swap",
//     1: "Deposit",
//     2: "Withdraw",
// };

export function formatTimestamp(timestamp: string): string {
    const date = new Date(Number(timestamp) * 1000);
    // DD/MM/YYYY
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

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
        refetchInterval: 2_500, // Poll every 2.5s to update transactions
    });

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
            <Table className="border-spacing-y-0 mb-2 rounded-b-lg border border-progress-bg">
                <TableHeader>
                    <TableRow>
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
                            Token
                        </TableHead>
                        <TableHead className="h-auto border-b border-progress-bg py-3 text-base font-medium">
                            Tx Hash
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
                    {txns.map((tx) => {
                        const hasAmountIn = tx.amountIn != null && tx.amountIn.toString() !== "0" && tx.tokenInDecimals != null;
                        const hasAmountOut = tx.amountOut != null && tx.amountOut.toString() !== "0" && tx.tokenOutDecimals != null;
                        const amount = hasAmountIn
                            ? formatAmount(tx.amountIn, tx.tokenInDecimals)
                            : hasAmountOut
                                ? formatAmount(tx.amountOut, tx.tokenOutDecimals)
                                : "—";
                        const token = hasAmountIn
                            ? tx.tokenInSymbol
                            : hasAmountOut
                                ? tx.tokenOutSymbol
                                : "—";
                        const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

                        return (
                            <TableRow key={tx.id} className="text-base text-greyed">
                                <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                                <TableCell>{txnKind[tx.kind]}</TableCell>
                                <TableCell>{amount}</TableCell>
                                <TableCell>{token}</TableCell>
                                <TableCell>
                                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
                                        {`${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`}
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
