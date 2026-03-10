import type { PoolDetailResponse } from "@/types/pool";
import { Container } from "./components";
import CanceledStatus from "./status/CanceledStatus";
import OnGoingStatus from "./status/OnGoingStatus";
import EndStatus from "./status/EndStatus";
import ClosedStatus from "./status/ClosedStatus";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const AmountAndActivity = ({ poolDetail }: Props) => {
    const status = poolDetail?.pool?.status;

    const renderContent = () => {
        if (!status) return null;

        switch (status) {
            case "on_going":
                return <OnGoingStatus poolDetail={poolDetail} />;

            case "closed":
                return <ClosedStatus poolDetail={poolDetail} />;

            case "canceled":
            case "ended":
            default:
                return null;
        }
    };

    return <Container>{renderContent()}</Container>;
};

export default AmountAndActivity;
