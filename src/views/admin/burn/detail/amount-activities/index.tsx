import type { PoolDetailResponse } from "@/types/pool";
import { Container } from "./components";
import DraftStatus from "./status/DraftStatus";
import PendingHoldingStatus from "./status/PendingHoldingStatus";
import UpcomingStatus from "./status/UpcomingStatus";
import CanceledStatus from "./status/CanceledStatus";
import OnGoingStatus from "./status/OnGoingStatus";
// import EndStatus from "./status/EndStatus";
import ClosedStatus from "./status/ClosedStatus";
import type { VaultBalance } from "./hooks/useOnChainVaultBalance";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const AmountAndActivity = ({ poolDetail, vaultBalance }: Props) => {
    const status = poolDetail?.pool?.status;

    const renderContent = () => {
        if (!status) return null;

        switch (status) {
            case "draft":
                return <DraftStatus poolDetail={poolDetail} />;

            case "pending":
            case "holding":
                return <PendingHoldingStatus poolDetail={poolDetail} />;

            case "upcoming":
                return <UpcomingStatus poolDetail={poolDetail} />;

            case "canceled":
                return <CanceledStatus poolDetail={poolDetail} />;

            case "on_going":
                return <OnGoingStatus poolDetail={poolDetail} />;

            case "closed":
                return <ClosedStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />;

            // case "ended":
            //     return <EndStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />;

            default:
                return null;
        }
    };

    return <Container>{renderContent()}</Container>;
};

export default AmountAndActivity;
