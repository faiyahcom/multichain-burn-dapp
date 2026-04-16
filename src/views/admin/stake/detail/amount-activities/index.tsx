import type { PoolDetailResponse } from "@/types/pool";
import { Container } from "./components";
import DraftStatus from "./status/DraftStatus";
import HoldingStatus from "./status/HoldingStatus";
import UpcomingStatus from "./status/UpcomingStatus";
import LiveStatus from "./status/LiveStatus";
import EndStatus from "./status/EndStatus";
import ClosedStatus from "./status/ClosedStatus";
import CanceledStatus from "./status/CanceledStatus";
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
                return <HoldingStatus poolDetail={poolDetail} />;

            case "upcoming":
                return <UpcomingStatus poolDetail={poolDetail} />;

            case "live":
            case "on_going":
                return <LiveStatus poolDetail={poolDetail} />;

            case "ended":
            case "end":
                return <EndStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />;

            case "closed":
                return <ClosedStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />;

            case "canceled":
                return <CanceledStatus poolDetail={poolDetail} />;

            default:
                return null;
        }
    };

    return <Container>{renderContent()}</Container>;
};

export default AmountAndActivity;
