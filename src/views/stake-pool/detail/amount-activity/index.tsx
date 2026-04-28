import type { PoolDetailResponse } from "@/types/pool";
import { useAuthStore } from "@/stores/authStore";
import { Container } from "./components";
import UpcomingStatus from "./status/UpcomingStatus";
import OnGoingStatus from "./status/OnGoingStatus";
import EndStatus from "./status/EndStatus";
import ClosedStatus from "./status/ClosedStatus";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const { user } = useAuthStore();
    const status = poolDetail?.pool?.status;
    const _isPoolOwner = user?.address === poolDetail?.pool?.owner;

    const renderContent = () => {
        if (!status) return null;

        switch (status) {
            case "upcoming":
                return <UpcomingStatus poolDetail={poolDetail} />;

            case "on_going":
                return <OnGoingStatus poolDetail={poolDetail} />;

            case "full":
                return <OnGoingStatus poolDetail={poolDetail} stakeDisabled />;
            case "ended":
                return <EndStatus poolDetail={poolDetail} />;

            case "closed":
                return <ClosedStatus poolDetail={poolDetail} />;

            default:
                return null;
        }
    };

    return <Container>{renderContent()}</Container>;
};

export default AmountAndActivity;
