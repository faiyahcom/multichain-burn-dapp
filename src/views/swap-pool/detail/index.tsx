import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import { trimAddress } from "./pool-overview";

type Props = {
    address: string;
};

const SwapPoolDetail = ({ address }: Props) => {
    const { data: poolDetail, isLoading: isLoadingPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
    });

    return (
        <div className="grid grid-cols-3 pt-9.5 pl-14">
            <div className="col-span-2">
                <div>
                    <h2 className="text-3xl font-semibold">{poolDetail?.pool.name}</h2>
                    <span className="text-base text-greyed">
                        {trimAddress(poolDetail?.pool.address)}
                    </span>
                </div>
                <PoolOverview poolDetail={poolDetail} />
                <RewardAmount poolDetail={poolDetail} />
            </div>
            <div className="col-span-1"></div>
        </div>
    );
};

export default SwapPoolDetail;
