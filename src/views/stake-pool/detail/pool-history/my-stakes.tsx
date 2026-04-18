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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import CustomPagination from "@/components/common/glow/glow-pagination";
import GlowContainer from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import { useUnstakeEvmFn } from "../hooks/byStakeId/useUnstakeEvmFn";
import { useClaimRewardEvmFn } from "../hooks/byStakeId/useClaimRewardEvmFn";
import { formatDuration } from "@/utils/helpers/timer";
import { shortenNumber } from "@/utils/helpers/numbers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

const formatUnixDate = (timestamp?: number): string => {
    if (timestamp == null) return "—";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const MyStakesTable = ({ poolDetail }: Props) => {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();
    const { unstakeEvm } = useUnstakeEvmFn();
    const { claimRewardEvm } = useClaimRewardEvmFn();
    const [loadingRows, setLoadingRows] = useState<
        Record<number, "unstake" | "claim" | null>
    >({});

    const poolAddress = poolDetail?.pool?.address;

    const { data: myStakesData, isLoading } = useQuery({
        queryKey: poolQueryKeys.myStakes(
            poolAddress || "",
            page,
            DEFAULT_PAGE_SIZE,
        ),
        queryFn: () =>
            poolService.getMyStakes(poolAddress || "", page, DEFAULT_PAGE_SIZE),
        enabled: !!poolAddress,
        refetchInterval: 5_000,
    });

    const invalidatePool = () => {
        if (poolAddress) {
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(poolAddress),
            });
            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.myStakes(poolAddress, page, DEFAULT_PAGE_SIZE),
            });
        }
    };

    const handleUnstakeClaim = async (stakeId: number) => {
        if (!poolAddress) return;
        setLoadingRows((prev) => ({ ...prev, [stakeId]: "unstake" }));
        try {
            await unstakeEvm({ poolAddress, stakeId });
            invalidatePool();
        } finally {
            setLoadingRows((prev) => ({ ...prev, [stakeId]: null }));
        }
    };

    const handleClaimReward = async (stakeId: number) => {
        if (!poolAddress) return;
        setLoadingRows((prev) => ({ ...prev, [stakeId]: "claim" }));
        try {
            await claimRewardEvm({ poolAddress, stakeId });
            invalidatePool();
        } finally {
            setLoadingRows((prev) => ({ ...prev, [stakeId]: null }));
        }
    };

    const snapshots = myStakesData?.snapshots ?? [];
    const isClosed = poolDetail?.pool?.status === "closed";

    const stakingSymbol =
        snapshots[0]?.tokenStake ?? poolDetail?.tokenIn?.symbol ?? "";
    const rewardSymbol =
        snapshots[0]?.tokenReward ?? poolDetail?.tokenOut?.symbol ?? "";

    const columns = [
        "Time",
        `Staking Amount`,
        "Unlock Date",
        "Interest Start Date",
        "Duration",
        "Interest End Date",
        "Claimable Date",
        `Reward Amount`,
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
                                        className="px-4 text-center font-orbitron text-sm md:px-6 md:text-base lg:text-xl 2xl:text-28px"
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
                                data={snapshots}
                                isLoading={isLoading}
                            />
                            {snapshots.map((row) => {
                                const rowLoading = loadingRows[row.stakeId];

                                return (
                                    <TableRow
                                        key={`${row.stakeId}-${row.time}`}
                                        variant="stake"
                                        className="text-xs md:text-sm lg:text-base 2xl:text-xl [&>td]:px-4 [&>td]:text-center [&>td]:md:px-6"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            {formatUnixDate(row.time)}
                                        </TableCell>
                                        <TableCell>
                                            {`${shortenNumber({ number: Number(row.stakingAmount) })} ${stakingSymbol}`}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatUnixDate(row.unlockDate)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatUnixDate(row.interestStartDate)}
                                        </TableCell>
                                        <TableCell>{formatDuration(row.durationInSecs)}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatUnixDate(row.interestEndDate)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {formatUnixDate(row.claimableDate)}
                                        </TableCell>
                                        <TableCell>{`${shortenNumber({ number: Number(row.rewardAmount) })} ${rewardSymbol}`}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1.5 font-orbitron">
                                                <Button
                                                    variant="stake"
                                                    hasHover
                                                    size="default"
                                                    disabled={
                                                        row.isUnstaked ||
                                                        isClosed ||
                                                        rowLoading != null ||
                                                        Date.now() / 1000 < row.unlockDate
                                                    }
                                                    isLoading={rowLoading === "unstake"}
                                                    onClick={() => handleUnstakeClaim(row.stakeId)}
                                                    className="text-xs whitespace-nowrap md:text-sm"
                                                >
                                                    Unstake &amp; Claim
                                                </Button>
                                                <Button
                                                    variant="stake"
                                                    hasHover
                                                    size="default"
                                                    disabled={
                                                        row.isUnstaked ||
                                                        isClosed ||
                                                        rowLoading != null ||
                                                        Date.now() / 1000 < row.claimableDate
                                                    }
                                                    isLoading={rowLoading === "claim"}
                                                    onClick={() => handleClaimReward(row.stakeId)}
                                                    className="text-xs whitespace-nowrap md:text-sm"
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
                totalCount={myStakesData?.total || 0}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={(page) => setPage(page)}
                variant="stake"
            />
        </div>
    );
};

export default MyStakesTable;
