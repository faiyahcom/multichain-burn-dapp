import type { PoolDetailResponse } from "@/types/pool";
import { useAuthStore } from "@/stores/authStore";
import { Container } from "./components";
import DraftStatus from "./status/DraftStatus";
import PendingHoldingStatus from "./status/PendingHoldingStatus";
import UpcomingStatus from "./status/UpcomingStatus";
import CanceledStatus from "./status/CanceledStatus";
import OnGoingStatus from "./status/OnGoingStatus";
import EndStatus from "./status/EndStatus";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const { user } = useAuthStore();
    const status = poolDetail?.pool?.status;
    const isPoolOwner = user?.address === poolDetail?.pool?.owner;

    const renderContent = () => {
        if (!status) return null;

        switch (status) {
            case "draft":
                if (!isPoolOwner) return null;
                return <DraftStatus poolDetail={poolDetail} />;

            case "pending":
            case "holding":
                if (!isPoolOwner) return null;
                return <PendingHoldingStatus poolDetail={poolDetail} />;

            case "upcoming":
                return <UpcomingStatus poolDetail={poolDetail} />;

            case "canceled":
                return <CanceledStatus poolDetail={poolDetail} />;

            case "on_going":
                return <OnGoingStatus poolDetail={poolDetail} />;

            case "ended":
                return <EndStatus poolDetail={poolDetail} />;

            case "closed":
            default:
                return null;
        }
    };

    return <Container>{renderContent()}</Container>;
};

export default AmountAndActivity;
