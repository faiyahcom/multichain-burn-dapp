import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activities";
import { SWAP_POOL_STATUS, BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { SwapPoolStatus, BurnPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import ScanLink from "@/components/common/scan-link";

type Props = {
    address: string;
};

const AdminSwapPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
    });

    const status = poolDetail?.pool.status;
    const safeStatus: BurnPoolStatus = status ?? "on_going";

    const renderExtraContent = () => {
        if (!status) return null;

        switch (status) {
            case "pending":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool is waiting for admin approval.
                    </p>
                );
            case "upcoming":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool is waiting for admin approval.
                    </p>
                );
            case "holding":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        Pool has reached its start time but is awaiting admin action.
                    </p>
                );
            case "on_going":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool is currently active. Users can participate until the end time.
                    </p>
                );
            case "closed":
                return (
                    <p className="bg-admin-warning ml-auto rounded-md px-6 py-2 text-base">
                        This pool has been emergency closed by the admin.
                    </p>
                );
            case "ended":
                return (
                    <p className="bg-admin-warning ml-auto rounded-md px-6 py-2 text-base">
                        This pool has ended. Participation is no longer possible.
                    </p>
                );
            case "canceled":
                return (
                    <p className="bg-admin-warning ml-auto rounded-md px-6 py-2 text-base">
                        This pool has been manually canceled by the Project Owner.
                    </p>
                );
            case "draft":
            default:
                return null;
        }
    };

    return (
        <div className="pt-9.5 pl-14">
            <div className="space-y-2">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-semibold">{poolDetail?.pool.name}</h2>
                    <AnimateIconButton
                        iconLetter={BURN_POOL_STATUS[safeStatus]?.letter}
                        textVariant="text-container-center"
                        text={BURN_POOL_STATUS[safeStatus]?.label}
                        color={BURN_POOL_STATUS[safeStatus]?.color}
                        hasGroupHover
                        classNames={{
                            btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
                            text: "text-2xl font-medium",
                            icon: "size-9 text-3xl",
                        }}
                    />
                    <div className="flex flex-1">{renderExtraContent()}</div>
                </div>
                <ScanLink address={poolDetail?.pool.address ?? ""} chainId={poolDetail?.pool.chainId} />
            </div>
            <div className="grid grid-cols-3 gap-x-6">
                <div className="col-span-2">
                    <PoolOverview poolDetail={poolDetail} />
                    <RewardAmount poolDetail={poolDetail} />
                </div>
                <div className="col-span-1">
                    <AmountAndActivity poolDetail={poolDetail} />
                </div>
            </div>
            <PoolHistory poolDetail={poolDetail} />
        </div>
    );
};

export default AdminSwapPoolDetail;
