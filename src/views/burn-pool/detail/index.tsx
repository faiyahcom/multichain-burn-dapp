import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activities";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { BurnPoolStatusDisplay } from "@/components/shared/glow/pool/pool-status";
import type { BurnPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import { useState, useEffect, useRef } from "react";
import ScanLink from "@/components/common/scan-link";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import GlowContainer from "@/components/common/glow/container";
import InfoTooltip from "@/components/common/glow/info-tooltip";

type Props = {
    address: string;
};

const useCountdown = (targetTime: string, onExpire?: () => void) => {
    const calcRemaining = () => {
        const diff = Number(targetTime) * 1000 - Date.now();
        if (diff <= 0) return null;
        const days = Math.floor(diff / 86_400_000);
        const hours = Math.floor((diff % 86_400_000) / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1_000);
        return { days, hours, minutes, seconds };
    };

    const [remaining, setRemaining] = useState(calcRemaining);
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const id = setInterval(() => {
            const r = calcRemaining();
            setRemaining(r);
            if (r === null) {
                clearInterval(id);
                // Delay 1s, then poll onExpire repeatedly until unmount
                delayRef.current = setTimeout(() => {
                    onExpireRef.current?.();
                    pollRef.current = setInterval(() => onExpireRef.current?.(), 2_000);
                }, 1_000);
            }
        }, 1_000);
        return () => {
            clearInterval(id);
            if (delayRef.current) clearTimeout(delayRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [targetTime]);

    return remaining;
};

const pad = (n: number) => String(n).padStart(2, "0");

const formatCountdown = (remaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}) => {
    const { days, hours, minutes, seconds } = remaining;
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    parts.push(`${pad(hours)}h`, `${pad(minutes)}m`, `${pad(seconds)}s`);
    return parts.join(" ");
};

const UpcomingCountdown = ({
    startTime,
    poolAddress,
}: {
    startTime: string;
    poolAddress: string;
}) => {
    const queryClient = useQueryClient();
    const remaining = useCountdown(startTime, () => {
        queryClient.invalidateQueries({
            queryKey: poolQueryKeys.detail(poolAddress),
            exact: false,
        });
    });
    if (!remaining) return null;
    return (
        <p className="text-sm md:text-base lg:text-xl">
            <span className="font-bold">Starts in: </span>
            <span>{formatCountdown(remaining)}</span>
        </p>
    );
};

const EndingCountdown = ({
    endTime,
    poolAddress,
}: {
    endTime: string;
    poolAddress: string;
}) => {
    const queryClient = useQueryClient();
    const remaining = useCountdown(endTime, () => {
        queryClient.invalidateQueries({
            queryKey: poolQueryKeys.detail(poolAddress),
            exact: false,
        });
    });
    if (!remaining) return null;
    return (
        <p className="text-sm md:text-base lg:text-xl">
            <span className="font-bold">Ends in: </span>
            <span>{formatCountdown(remaining)}</span>
        </p>
    );
};

const BurnPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
        refetchInterval: 2_500, // Poll every 2.5s to update countdown and status
    });

    const status = poolDetail?.pool.status;
    const safeStatus: BurnPoolStatus = status ?? "on_going";

    const renderExtraContent = () => {
        if (!status) return null;

        switch (status) {
            case "pending":
                return (
                    <GlowContainer
                        variant="green"
                        className="ml-auto rounded-md bg-mb-popover px-3 py-0.5 text-xs text-mb-glow-green md:px-6 md:py-1.5 md:text-sm lg:text-base"
                    >
                        This pool is pending approval. It will go live after approval.
                    </GlowContainer>
                );
            case "upcoming":
                return poolDetail?.pool.timeStart ? (
                    <UpcomingCountdown
                        startTime={poolDetail.pool.timeStart}
                        poolAddress={address}
                    />
                ) : null;
            case "holding":
                return null;
            case "on_going":
                return poolDetail?.pool.timeEnd ? (
                    <EndingCountdown
                        endTime={poolDetail.pool.timeEnd}
                        poolAddress={address}
                    />
                ) : null;
            case "canceled":
            case "ended":
            case "closed":
            case "draft":
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 font-inter lg:space-y-17.5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6 lg:gap-10">
                {isLoadingPoolDetail ? (
                    <>
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-9 w-27" />
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-2.5 sm:pl-3 md:pl-6 lg:pl-9">
                            <h2 className="text-xl font-semibold break-all md:text-2xl lg:text-3xl 2xl:text-4xl">
                                {poolDetail?.pool.name}
                            </h2>
                            <ScanLink
                                address={poolDetail?.pool.address ?? ""}
                                chainId={poolDetail?.pool.chainId}
                                className="font-inter w-fit text-sm md:text-base lg:text-xl 2xl:text-2xl"
                                iconClassName="size-3.5"
                            />
                        </div>
                        <BurnPoolStatusDisplay className="w-3/7 min-w-20 px-2 py-1.5 text-sm sm:w-64 sm:text-base md:px-3 md:py-2 md:text-sm lg:px-5 lg:text-2xl 2xl:px-6 2xl:py-3">
                            {BURN_POOL_STATUS[safeStatus].label}
                            {safeStatus === "holding" && (
                                <InfoTooltip
                                    content="This pool reached its start time but has not been approved by admin. It is currently on holding."
                                    side="right"
                                    variant="burn"
                                />
                            )}
                        </BurnPoolStatusDisplay>
                        <div className="flex w-full flex-wrap md:min-w-0 md:flex-1">
                            {renderExtraContent()}
                        </div>
                    </>
                )}
            </div>
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-x-6 lg:gap-y-9.5">
                <div className="order-1 lg:col-span-2">
                    <PoolOverview poolDetail={poolDetail} />
                </div>
                <div className="order-2 lg:col-span-1 lg:row-span-3">
                    <AmountAndActivity poolDetail={poolDetail} />
                </div>
                <div className="order-3 lg:col-span-2">
                    <RewardAmount poolDetail={poolDetail} />
                </div>
                <div className="order-4 lg:col-span-2">
                    <PoolHistory poolDetail={poolDetail} />
                </div>
            </div>
        </div>
    );
};

export default BurnPoolDetail;
