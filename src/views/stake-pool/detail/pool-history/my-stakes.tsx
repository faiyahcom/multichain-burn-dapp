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
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import type { PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import CustomPagination from "@/components/common/glow/glow-pagination";
import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import { formatTimestamp } from "./transaction-history";
import { useUnstakeEvmFn } from "../hooks/fn/byStakeId/evm/useUnstakeEvmFn";
import { useClaimRewardEvmFn } from "../hooks/fn/byStakeId/evm/useClaimRewardEvmFn";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

// Include only staking-related kinds: 51=Staking, 52=Unstaking, 53=Reward Claimed
const INCLUDE_KINDS = "51,52,53";

import { formatDuration } from "@/utils/helpers/timer";

const formatDate = (timestamp?: string): string => {
    if (!timestamp) return "—";
    return formatTimestamp(timestamp);
};

const MyStakesTable = ({ poolDetail }: Props) => {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const { unstakeEvm } = useUnstakeEvmFn();
    const { claimRewardEvm } = useClaimRewardEvmFn();
    const [loadingRows, setLoadingRows] = useState<Record<string, "unstake" | "claim" | null>>({});

    const { data: poolTxns, isLoading } = useQuery({
        queryKey: poolQueryKeys.txns(
            poolDetail?.pool.address || "",
            page,
            undefined,
            INCLUDE_KINDS,
        ),
        queryFn: () =>
            poolService.getPoolTxns(
                page,
                DEFAULT_PAGE_SIZE,
                poolDetail?.pool.address || "",
                undefined,
                INCLUDE_KINDS,
            ),
        enabled: !!poolDetail?.pool.address,
        refetchInterval: 2_500,
    });

    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const invalidatePool = () => {
        if (poolDetail?.pool?.address) {
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(poolDetail.pool.address),
            });
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.txns(poolDetail.pool.address, page, undefined, INCLUDE_KINDS),
            });
        }
    };

    const handleUnstakeClaim = async (txId: string, stakeId: number) => {
        if (!poolDetail?.pool?.address) return;
        setLoadingRows((prev) => ({ ...prev, [txId]: "unstake" }));
        try {
            await unstakeEvm({ poolAddress: poolDetail.pool.address, stakeId });
            invalidatePool();
        } finally {
            setLoadingRows((prev) => ({ ...prev, [txId]: null }));
        }
    };

    const handleClaimReward = async (txId: string, stakeId: number) => {
        if (!poolDetail?.pool?.address) return;
        setLoadingRows((prev) => ({ ...prev, [txId]: "claim" }));
        try {
            await claimRewardEvm({ poolAddress: poolDetail.pool.address, stakeId });
            invalidatePool();
        } finally {
            setLoadingRows((prev) => ({ ...prev, [txId]: null }));
        }
    };

    const txns = poolTxns?.txns ?? [];
    const isClosed = poolDetail?.pool?.status === "closed";

    const columns = [
        "Time",
        `Staking Amount (${stakingTokenDisplay.symbol})`,
        "Unlock Date",
        "Interest Start Date",
        "Duration",
        "Interest End Date",
        "Claimable Date",
        `Reward Amount (${rewardTokenDisplay.symbol})`,
        "Action",
    ];

    return (
        <div className="space-y-9.5">
            <GlowContainer
                variant="stake"
                className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
            >
                <div className="overflow-x-auto">
                    <Table className="py-6 sm:border-spacing-y-5">
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableHead
                                        key={col}
                                        variant="stake"
                                        className="whitespace-nowrap font-orbitron text-sm md:text-base lg:text-xl 2xl:text-28px"
                                    >
                                        {col}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableSkeleton
                                colCount={columns.length}
                                rowCount={3}
                                isLoading={isLoading}
                            />
                            <TableNoData
                                colSpan={columns.length}
                                data={txns}
                                isLoading={isLoading}
                            />
                            {txns.map((tx) => {
                                const stakeAmount =
                                    tx.amountIn != null && tx.tokenInDecimals != null
                                        ? formatAmount(tx.amountIn, tx.tokenInDecimals)
                                        : "—";
                                const rewardAmount = tx.rewardAmountStr
                                    ? formatAmount(
                                        tx.rewardAmountStr,
                                        poolDetail?.pool?.rewardTokenDecimals ?? 18,
                                    )
                                    : "—";
                                const duration = formatDuration(tx.lockDuration);
                                const hasStakeId = tx.stakeId != null;
                                const rowLoading = loadingRows[tx.id];

                                return (
                                    <TableRow
                                        key={tx.id}
                                        variant="stake"
                                        className="text-xs md:text-sm lg:text-base 2xl:text-xl"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            {formatTimestamp(tx.timestamp)}
                                        </TableCell>
                                        <TableCell>{stakeAmount}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(tx.unlockDate)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(tx.interestStartDate)}
                                        </TableCell>
                                        <TableCell>{duration}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(tx.interestEndDate)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatDate(tx.claimableDate)}
                                        </TableCell>
                                        <TableCell>{rewardAmount}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <Button
                                                    variant="stake"
                                                    hasHover
                                                    size="default"
                                                    disabled={
                                                        !hasStakeId || isClosed || rowLoading != null
                                                    }
                                                    isLoading={rowLoading === "unstake"}
                                                    onClick={() =>
                                                        tx.stakeId != null &&
                                                        handleUnstakeClaim(tx.id, tx.stakeId)
                                                    }
                                                    className="whitespace-nowrap text-xs md:text-sm"
                                                >
                                                    Unstake &amp; Claim
                                                </Button>
                                                <Button
                                                    variant="stake"
                                                    hasHover
                                                    size="default"
                                                    disabled={
                                                        !hasStakeId || isClosed || rowLoading != null
                                                    }
                                                    isLoading={rowLoading === "claim"}
                                                    onClick={() =>
                                                        tx.stakeId != null &&
                                                        handleClaimReward(tx.id, tx.stakeId)
                                                    }
                                                    className="whitespace-nowrap text-xs md:text-sm"
                                                >
                                                    Claim Reward
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </GlowContainer>
            <CustomPagination
                currentPage={page}
                totalCount={poolTxns?.total || 0}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={(page) => setPage(page)}
                variant="stake"
            />
        </div>
    );
};

export default MyStakesTable;
