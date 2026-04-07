import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activity";
import { SWAP_POOL_STATUS } from "@/types/admin/whitelist-token";
import type { SwapPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import ScanLink from "@/components/common/scan-link";
import { Skeleton } from "@/components/ui/skeleton";
import { SwapPoolStatusDisplay } from "@/components/shared/glow/pool/pool-status";

type Props = {
    address: string;
};

const SwapPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
        refetchInterval: 2_500, // Poll every 2.5s to update countdown and status
    });

    const status = poolDetail?.pool.status;
    const safeStatus: SwapPoolStatus = (status as SwapPoolStatus) ?? "on_going";

    return (
        <div className="space-y-6 lg:space-y-17.5">
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
                                address={address ?? ""}
                                chainId={poolDetail?.pool.chainId}
                                className="w-fit font-inter text-sm md:text-base lg:text-xl 2xl:text-2xl"
                                iconClassName="size-3.5"
                            />
                        </div>
                        <SwapPoolStatusDisplay className="w-3/7 min-w-20 px-2 py-1.5 text-sm sm:w-64 sm:text-base md:px-3 md:py-2 md:text-sm lg:px-5 lg:text-2xl 2xl:px-6 2xl:py-3">
                            {SWAP_POOL_STATUS[safeStatus].label}
                        </SwapPoolStatusDisplay>
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

export default SwapPoolDetail;
