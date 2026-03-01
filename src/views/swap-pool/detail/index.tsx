import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import { trimAddress } from "./pool-overview";
import AmountAndActivity from "./amount-activity";
import TransactionHistoryTable from "./pool-history/transaction-history";

type Props = {
    address: string;
};

const SwapPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
    });

    const status = poolDetail?.pool.status ?? "";
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).split("_").join("");

    return (
        <div className="pt-9.5 pl-14">
            <div>
                <div className="flex items-center gap-6">
                    <h2 className="text-3xl font-semibold">{poolDetail?.pool.name}</h2>
                    <span className="text-2xl font-medium">
                        {formattedStatus}
                    </span>
                </div>
                <span className="text-base text-greyed">
                    {trimAddress(poolDetail?.pool.address)}
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
