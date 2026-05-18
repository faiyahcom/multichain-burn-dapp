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
import { chainIdToNetworkConfig } from "@/config/networks";
import { getExplorerTxUrl } from "@/utils/helpers/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import React from "react";
import { txnKind, type PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import CustomPagination from "@/components/common/glow/glow-pagination";
import GlowContainer from "@/components/common/glow/container";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";

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
        queryKey: poolQueryKeys.txns(poolDetail?.pool.address || "", page),
        queryFn: () =>
            poolService.getPoolTxns(
                page,
                DEFAULT_PAGE_SIZE,
                poolDetail?.pool.address || "",
                Object.keys(txnKind)
                    .map((k) => Number(k))
                    .filter((k) => k < 11)
                    .join(","),
            ),
        enabled: !!poolDetail?.pool.address,
        refetchInterval: 2_500,
    });

    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const paymentTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const saleTokenDisplay = resolvePoolTokenDisplay({
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
        )
            return paymentTokenDisplay.symbol;
        if (
            txTokenAddress?.toLowerCase() ===
            poolDetail?.pool?.rewardToken?.toLowerCase()
        )
            return saleTokenDisplay.symbol;
        return fallbackSymbol;
    };

    const txns = poolTxns?.txns ?? [];

    return (
        <div className="space-y-9.5">
            <GlowContainer
                variant="launchpad"
                className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
            >
                <Table className="py-6 sm:border-spacing-y-5">
                    <TableHeader>
                        <TableRow>
                            {["Time", "Action", "Amount", "Token", "Tx Hash"].map((col) => (
                                <TableHead
                                    key={col}
                                    variant="launchpad"
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
                            const kind = Number(tx.kind);

                            const hasAmountIn =
                                tx.amountIn != null &&
                                tx.amountIn.toString() !== "0" &&
                                tx.tokenInDecimals != null;
                            const hasAmountOut =
                                tx.amountOut != null &&
                                tx.amountOut.toString() !== "0" &&
                                tx.tokenOutDecimals != null;

                            const inAmount = hasAmountIn
                                ? formatAmount(tx.amountIn, tx.tokenInDecimals!)
                                : null;
                            const inSymbol = hasAmountIn
                                ? resolveTokenSymbol(tx.tokenIn, tx.tokenInSymbol)
                                : null;
                            const outAmount = hasAmountOut
                                ? formatAmount(tx.amountOut, tx.tokenOutDecimals!)
                                : null;
                            const outSymbol = hasAmountOut
                                ? resolveTokenSymbol(tx.tokenOut, tx.tokenOutSymbol)
                                : null;

                            let amountCell: React.ReactNode;
                            let tokenCell: React.ReactNode;
                            switch (kind) {
                                case 12: // Deposit & Instant Claim → In → Out
                                    amountCell = (
                                        <span className="inline-flex items-center gap-1">
                                            <span>{inAmount ?? "—"}</span>
                                            <span className="opacity-50">→</span>
                                            <span>{outAmount ?? "—"}</span>
                                        </span>
                                    );
                                    tokenCell = (
                                        <span className="inline-flex items-center gap-1">
                                            <span>{inSymbol ?? "—"}</span>
                                            <span className="opacity-50">→</span>
                                            <span>{outSymbol ?? "—"}</span>
                                        </span>
                                    );
                                    break;
                                case 11: // Deposit → In only
                                    amountCell = <span>{inAmount ?? "—"}</span>;
                                    tokenCell = <span>{inSymbol ?? "—"}</span>;
                                    break;
                                case 13: // Claim
                                case 14: // Receive Reward → Out only
                                    amountCell = <span>{outAmount ?? "—"}</span>;
                                    tokenCell = <span>{outSymbol ?? "—"}</span>;
                                    break;
                                default:
                                    amountCell = <span>{inAmount ?? outAmount ?? "—"}</span>;
                                    tokenCell = <span>{inSymbol ?? outSymbol ?? "—"}</span>;
                            }

                            const explorerUrl = getExplorerTxUrl(tx.chainId, tx.hash);

                            return (
                                <TableRow
                                    key={tx.id}
                                    variant="launchpad"
                                    className="text-xs md:text-sm lg:text-base 2xl:text-xl"
                                >
                                    <TableCell>
                                        {formatTimestampSecondsToDate({ timestamp: tx.timestamp })}
                                    </TableCell>
                                    <TableCell>{launchpadActionLabel(kind)}</TableCell>
                                    <TableCell>{amountCell}</TableCell>
                                    <TableCell>{tokenCell}</TableCell>
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
                variant="launchpad"
            />
        </div>
    );
};

export default TransactionHistoryTable;
