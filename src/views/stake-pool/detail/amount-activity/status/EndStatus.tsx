import type { PoolDetailResponse } from "@/types/pool";
import OnGoingStatus from "./OnGoingStatus";

// EndStatus is the same as OnGoingStatus but with Stake disabled
type Props = {
    poolDetail?: PoolDetailResponse;
};

const EndStatus = ({ poolDetail }: Props) => {
    return <OnGoingStatus poolDetail={poolDetail} stakeDisabled />;
};

export default EndStatus;
