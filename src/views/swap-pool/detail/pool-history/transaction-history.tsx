import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { NETWORK_CONFIGS } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import type { PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";

// const TX_KIND_LABELS: Record<number, string> = {
//     0: "Swap",
//     1: "Deposit",
//     2: "Withdraw",
// };

function getExplorerTxUrl(chainId: string, hash: string): string {
    const network = NETWORK_CONFIGS.find(
        (n) => n.appKitNetwork.id.toString() === chainId,
    );
    const baseUrl = network?.appKitNetwork.blockExplorers?.default?.url;
    if (!baseUrl) return "#";
    // Solana explorer uses different path format
    if (chainId === "103" || network?.id === "solanaDevnet") {
        return `${baseUrl.replace(/\/$/, "")}/tx/${hash}?cluster=devnet`;
    }
    return `${baseUrl.replace(/\/$/, "")}/tx/${hash}`;
}

function formatTimestamp(timestamp: string): string {
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

const TransactionHistoryTable = ({ poolDetail }: Props) => {
    const { data: poolTxns, isLoading } = useQuery({
        queryKey: poolQueryKeys.txns(poolDetail?.pool.address || ""),
        queryFn: () =>
            poolService.getPoolTxns(1, 10, poolDetail?.pool.address || ""),
        enabled: !!poolDetail?.pool.address,
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
        <Table className="border-spacing-y-0 rounded-b-lg border border-progress-bg">
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
                    const amount =
                        tx.amountIn && tx.tokenInDecimals != null
                            ? formatAmount(tx.amountIn, tx.tokenInDecimals)
                            : tx.amountOut && tx.tokenOutDecimals != null
                                ? formatAmount(tx.amountOut, tx.tokenOutDecimals)
                                : "—";
                    const token = tx.tokenInSymbol || tx.tokenOutSymbol || "—";
                    const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

                    return (
                        <TableRow key={tx.id} className="text-base text-greyed">
                            <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                            <TableCell></TableCell>
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
    );
};

export default TransactionHistoryTable;
