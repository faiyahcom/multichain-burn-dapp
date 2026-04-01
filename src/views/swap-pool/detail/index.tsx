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
        <div className="pt-9.5 pl-14 space-y-17.5">
            <div className="flex items-center gap-10">
                {isLoadingPoolDetail ? (
                    <>
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-9 w-27" />
                    </>
                ) : (
                    <>
                        <div className="flex flex-col pl-9 gap-2.5">
                            <h2 className="text-4xl font-semibold">
                                {poolDetail?.pool.name}
                            </h2>
                            <ScanLink
                                address={address ?? ""}
                                chainId={poolDetail?.pool.chainId}
                                className="font-inter text-2xl"
                                iconClassName="size-3.5"
                            />
                        </div>
                        <SwapPoolStatusDisplay>
                            {SWAP_POOL_STATUS[safeStatus].label}
                        </SwapPoolStatusDisplay>
                    </>
                )}
            </div>
            <div className="grid grid-cols-3 gap-x-6">
                <div className="col-span-2 space-y-9.5">
                    <PoolOverview poolDetail={poolDetail} />
                    <RewardAmount poolDetail={poolDetail} />
                    <PoolHistory poolDetail={poolDetail} />
                </div>
                <div className="col-span-1">
                    <AmountAndActivity poolDetail={poolDetail} />
                </div>
            </div>
        </div>
    );
};

export default SwapPoolDetail;
