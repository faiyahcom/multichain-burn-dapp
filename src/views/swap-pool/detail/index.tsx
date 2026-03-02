import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import { trimAddress } from "./pool-overview";
import AmountAndActivity from "./amount-activity";
import TransactionHistoryTable from "./pool-history/transaction-history";
import { IconGoTo } from "@/assets/react";
import { POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { PoolStatus } from "@/types/pool";

type Props = {
    address: string;
};

const SwapPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
    });

    const status = poolDetail?.pool.status;
    const safeStatus: PoolStatus = status ?? "on_going";
    const formattedStatus =
        safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1).split("_").join("");

    return (
        <div className="pt-9.5 pl-14">
            <div className="space-y-2">
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-semibold">{poolDetail?.pool.name}</h2>
                    <AnimateIconButton
                        iconLetter={POOL_STATUS[safeStatus].letter}
                        textVariant="text-container-center"
                        text={formattedStatus}
                        color={POOL_STATUS[safeStatus].color}
                        hasGroupHover
                        classNames={{
                            btn: "min-w-27 cursor-default",
                            text: "text-2xl font-medium",
                            icon: "size-9 text-3xl",
                        }}
                    />
                    {/* <span className="text-2xl font-medium">{formattedStatus}</span> */}
                </div>
                <span className="flex items-baseline gap-3.5 text-base text-greyed">
                    {trimAddress(poolDetail?.pool.address)} <IconGoTo />
                </span>
            </div>
            <div className="grid grid-cols-3 gap-x-6">
                <div className="col-span-2">
                    <PoolOverview poolDetail={poolDetail} />
                    <RewardAmount poolDetail={poolDetail} />
                    <div className="mt-3 w-full py-4">
                        <div className="flex items-center gap-2 pb-6">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Pool History</span>
                        </div>
                        <TransactionHistoryTable poolDetail={poolDetail} />
                    </div>
                </div>
                <div className="col-span-1">
                    <AmountAndActivity poolDetail={poolDetail} />
                </div>
            </div>
        </div>
    );
};

export default SwapPoolDetail;
