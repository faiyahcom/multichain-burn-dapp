import { Button } from "@/components/common/glow/button";
import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/glow/table";
import TableSkeleton from "@/components/common/glow/table-skeleton";
import NoData from "@/components/common/no-data";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import type { PoolDetailResponse } from "@/types/pool";
import { shortenNumber } from "@/utils/helpers/numbers";
import { formatDuration } from "@/utils/helpers/timer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useClaimRewardEvmFn } from "../hooks/byStakeId/useClaimRewardEvmFn";
import { useUnstakeEvmFn } from "../hooks/byStakeId/useUnstakeEvmFn";
import { useClaimRewardSolFn } from "../hooks/byStakeId/useClaimRewardSolFn";
import { useUnstakeSolFn } from "../hooks/byStakeId/useUnstakeSolFn";
import { useAppKitAccount } from "@reown/appkit/react";

type Props = {
  poolDetail?: PoolDetailResponse;
  getTimestamp: () => number;
};

const DEFAULT_PAGE_SIZE = 5;

const formatUnixDateTime = (
  timestamp?: number,
): { time: string; date: string } | null => {
  if (timestamp == null || timestamp === 0) return null;
  const d = new Date(timestamp * 1000);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return { time, date };
};

const DateTimeCell = ({ timestamp }: { timestamp?: number }) => {
  const parts = formatUnixDateTime(timestamp);
  if (!parts) return <span>Unlimited</span>;
  return (
    <div className="flex flex-col items-center leading-snug">
      <span>{parts.time}</span>
      <span>{parts.date}</span>
    </div>
  );
};

const MyStakesTable = ({ poolDetail, getTimestamp }: Props) => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { unstakeEvm } = useUnstakeEvmFn();
  const { claimRewardEvm } = useClaimRewardEvmFn();
  const { unstakeSol } = useUnstakeSolFn();
  const { claimRewardSol } = useClaimRewardSolFn();
  const { caipAddress } = useAppKitAccount();
  const isSolana = caipAddress?.split(":")[0] === "solana";
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
      poolService.getMyStakes(poolAddress || "", page, DEFAULT_PAGE_SIZE, Math.floor(getTimestamp() / 1000)),
    enabled: !!poolAddress,
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
      if (isSolana) {
        await unstakeSol({
          poolAddress,
          stakeId,
          depositMint: poolDetail?.pool?.tokenIn ?? "",
          assetTypeIn: poolDetail?.pool?.assetTypeIn ?? 0,
          rewardMint: poolDetail?.pool?.rewardToken ?? "",
          assetTypeReward: poolDetail?.pool?.assetTypeReward ?? 0,
        });
      } else {
        await unstakeEvm({ poolAddress, stakeId });
      }
      invalidatePool();
    } finally {
      setLoadingRows((prev) => ({ ...prev, [stakeId]: null }));
    }
  };

  const handleClaimReward = async (stakeId: number) => {
    if (!poolAddress) return;
    setLoadingRows((prev) => ({ ...prev, [stakeId]: "claim" }));
    try {
      if (isSolana) {
        await claimRewardSol({
          poolAddress,
          stakeId,
          rewardMint: poolDetail?.pool?.rewardToken ?? "",
          assetTypeReward: poolDetail?.pool?.assetTypeReward ?? 0,
        });
      } else {
        await claimRewardEvm({ poolAddress, stakeId });
      }
      invalidatePool();
    } finally {
      setLoadingRows((prev) => ({ ...prev, [stakeId]: null }));
    }
  };

  const snapshots = myStakesData?.snapshots ?? [];
  const isClosed = poolDetail?.pool?.status === "closed";

  const stakingSymbol =
    snapshots[0]?.customSymbolStake ?? poolDetail?.tokenIn?.symbol ?? "";
  const rewardSymbol =
    snapshots[0]?.customSymbolReward ?? poolDetail?.tokenOut?.symbol ?? "";

  const columns = [
    "Time",
    `Staking Amount`,
    "Unlock Date",
    "Interest Start Date",
    "Duration",
    "Interest End Date",
    "Claimable Date",
    `Claimable Amount`,
    "Action",
  ];

  return (
    <div className="space-y-9.5">
      <GlowContainer
        variant="stake"
        className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
      >
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
            {snapshots.map((row) => {
              const rowLoading = loadingRows[row.stakeId];

              return (
                <TableRow
                  key={`${row.stakeId}-${row.time}`}
                  variant="stake"
                  className="text-xs md:text-sm lg:text-base 2xl:text-xl [&>td]:px-4 [&>td]:text-center [&>td]:md:px-6"
                >
                  <TableCell className="whitespace-nowrap">
                    <DateTimeCell timestamp={row.time} />
                  </TableCell>
                  <TableCell>
                    {`${shortenNumber({ number: Number(row.stakingAmount) })} ${stakingSymbol}`}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DateTimeCell timestamp={row.unlockDate} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DateTimeCell timestamp={row.interestStartDate} />
                  </TableCell>
                  <TableCell>
                    {row.durationInSecs === 0
                      ? "Unlimited"
                      : formatDuration(row.durationInSecs)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DateTimeCell timestamp={row.interestEndDate} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <DateTimeCell timestamp={row.claimableDate} />
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
                          Date.now() / 1000 < row.claimableDate ||
                          Number(row.rewardAmount) === 0
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
        <NoData
          data={snapshots}
          isLoading={isLoading}
          classNames={{
            text: "text-base sm:text-28px",
          }}
        />
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
