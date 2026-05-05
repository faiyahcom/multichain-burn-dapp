import type { PoolDetailResponse } from "@/types/pool";
import StakeStats from "./StakeStats";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    return <StakeStats poolDetail={poolDetail} stakeDisabled />;
};

export default UpcomingStatus;
