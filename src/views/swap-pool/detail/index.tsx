import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activity";
import { SWAP_POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { SwapPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import ScanLink from "@/components/common/scan-link";
import { Skeleton } from "@/components/ui/skeleton";

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
    const formattedStatus =
        safeStatus.charAt(0).toUpperCase() +
        safeStatus.slice(1).split("_").join("");

    return (
        <div className="pt-9.5 pl-14">
            <div className="space-y-2">
                <div className="flex items-center gap-6">
                    {isLoadingPoolDetail ? (
                        <>
                            <Skeleton className="h-9 w-48" />
                            <Skeleton className="h-9 w-27" />
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-semibold">
                                {poolDetail?.pool.name}
                            </h2>
                            <AnimateIconButton
                                iconLetter={SWAP_POOL_STATUS[safeStatus].letter}
                                textVariant="text-container-center"
                                text={formattedStatus}
                                color={SWAP_POOL_STATUS[safeStatus].color}
                                hasGroupHover
                                classNames={{
                                    btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
                                    text: "text-2xl font-medium",
                                    icon: "size-9 text-3xl",
                                }}
                            />
                        </>
                    )}
                </div>
                <ScanLink address={address ?? ""} chainId={poolDetail?.pool.chainId} />
            </div>
            <div className="grid grid-cols-3 gap-x-6">
                <div className="col-span-2">
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
