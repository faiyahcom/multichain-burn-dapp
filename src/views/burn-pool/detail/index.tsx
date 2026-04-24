import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activities";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { BurnPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import InfoTooltip from "@/components/common/info-tooltip";
import ScanLink from "@/components/common/scan-link";
import { StartsInCountdown, EndsInCountdown } from "@/components/shared/countdown";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
    address: string;
};



const BurnPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
        refetchInterval: 2_500, // Poll every 2.5s to update countdown and status
    });

    const status = poolDetail?.pool?.status;
    const safeStatus: BurnPoolStatus = status ?? "on_going";

    const renderExtraContent = () => {
        if (!status) return null;

        switch (status) {
            case "pending":
                return (
                    <p className="ml-auto rounded-md bg-mb-popover px-6 text-base text-success">
                        This pool is pending approval. It will go live after approval.
                    </p>
                );
            case "upcoming":
                return poolDetail?.pool?.timeStart ? (
                    <StartsInCountdown
                        startTime={poolDetail?.pool?.timeStart}
                        poolAddress={address}
                        className="text-xl"
                    />
                ) : null;
            case "holding":
                return (
                    <InfoTooltip
                        content="This pool reached its start time but has not been approved by admin. It is currently on holding."
                        side="right"
                    />
                );
            case "on_going":
                return poolDetail?.pool?.timeEnd ? (
                    <EndsInCountdown
                        endTime={poolDetail?.pool?.timeEnd}
                        poolAddress={address}
                        className="text-xl"
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
                                {poolDetail?.pool?.name?.slice(0, 20)}
                            </h2>
                            <AnimateIconButton
                                iconLetter={BURN_POOL_STATUS[safeStatus].letter}
                                textVariant="text-container-center"
                                text={BURN_POOL_STATUS[safeStatus]?.label}
                                color={BURN_POOL_STATUS[safeStatus].color}
                                hasGroupHover
                                classNames={{
                                    btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
                                    text: "text-2xl font-medium",
                                    icon: "size-9 text-3xl",
                                }}
                            />
                            <div className="flex flex-1">{renderExtraContent()}</div>
                        </>
                    )}
                </div>
                <ScanLink
                    address={poolDetail?.pool?.address ?? ""}
                    chainId={poolDetail?.pool?.chainId}
                />
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

export default BurnPoolDetail;
