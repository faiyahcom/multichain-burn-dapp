import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/common/glow/table";
import TableNoData from "@/components/common/glow/table-no-data";
import TableSkeleton from "@/components/common/glow/table-skeleton";
import { IconGoTo } from "@/assets/react";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { txnKind, type PoolDetailResponse } from "@/types/pool";
import { getExplorerTxUrl } from "@/utils/helpers/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CustomPagination from "@/components/common/glow/glow-pagination";
import GlowContainer from "@/components/common/glow/container";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";

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
            poolDetail?.pool.address || "",
            page,
            excludeKinds,
        ),
        queryFn: () =>
            poolService.getPoolTxns(
                page,
                DEFAULT_PAGE_SIZE,
                poolDetail?.pool.address || "",
                excludeKinds,
            ),
        enabled: !!poolDetail?.pool.address,
        refetchInterval: 2_500, // Poll every 2.5s to update transactions
    });

    // Resolve custom token symbols from pool detail
    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    // Map a transaction's raw token address to the pool's custom display symbol
    const resolveTokenSymbol = (txTokenAddress: string, fallbackSymbol: string) => {
        if (txTokenAddress?.toLowerCase() === poolDetail?.pool.tokenIn?.toLowerCase()) {
            return burnTokenDisplay.symbol;
        }
        if (txTokenAddress?.toLowerCase() === poolDetail?.pool.rewardToken?.toLowerCase()) {
            return rewardTokenDisplay.symbol;
        }
        return fallbackSymbol;
    };

    const txns = poolTxns?.txns ?? [];

    return (
        <div className="space-y-9.5">
            <GlowContainer
                variant="swap"
                className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
            >
                <Table className="py-6 sm:border-spacing-y-5">
                    <TableHeader>
                        <TableRow>
                            {["Time", "Action", "Amount", "Token", "Tx Hash"].map((col) => (
                                <TableHead
                                    key={col}
                                    variant="swap"
                                    className="font-orbitron text-sm md:text-base lg:text-xl 2xl:text-28px"
                                >
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableSkeleton colCount={5} rowCount={3} isLoading={isLoading} />
                        <TableNoData colSpan={5} data={txns} isLoading={isLoading} />
                        {txns.map((tx) => {
                            const hasAmountIn =
                                tx.amountIn != null &&
                                tx.amountIn.toString() !== "0" &&
                                tx.tokenInDecimals != null;
                            const hasAmountOut =
                                tx.amountOut != null &&
                                tx.amountOut.toString() !== "0" &&
                                tx.tokenOutDecimals != null;
                            const amount = hasAmountIn
                                ? formatAmount(tx.amountIn, tx.tokenInDecimals)
                                : hasAmountOut
                                    ? formatAmount(tx.amountOut, tx.tokenOutDecimals)
                                    : "—";
                            const token = hasAmountIn
                                ? resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol)
                                : hasAmountOut
                                    ? resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)
                                    : "—";
                            const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

                            return (
                                <TableRow key={tx.id} variant="swap" className="text-xs md:text-sm lg:text-base 2xl:text-xl">
                                    <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                                    <TableCell>{txnKind[tx.kind]}</TableCell>
                                    <TableCell>{amount}</TableCell>
                                    <TableCell>{token}</TableCell>
                                    <TableCell>
                                        <a
                                            href={explorerUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-baseline gap-2 transition-colors"
                                        >
                                            {`${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`}
                                            <IconGoTo className="size-3.5" />
                                        </a>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </GlowContainer>
            <CustomPagination
                currentPage={page}
                totalCount={poolTxns?.total || 0}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={(page) => setPage(page)}
                variant="swap"
            />
        </div>
    );
};

export default TransactionHistoryTable;
