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
import LowRewardNotiSwitch from "@/views/admin/master-pool-management/low-reward-noti-switch";

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
                return (
                    <DraftStatus poolDetail={poolDetail} />
                );

            case "pending":
            case "holding":
                return <HoldingStatus poolDetail={poolDetail} />;

            case "upcoming":
                return (
                    <UpcomingStatus poolDetail={poolDetail} />
                );

            case "on_going":
                return (
                    <LiveStatus poolDetail={poolDetail} />
                );

            case "full":
                return (
                    <LiveStatus poolDetail={poolDetail} />
                );

            case "ended":
                return (
                    <EndStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />
                );

            case "closed":
                return (
                    <ClosedStatus poolDetail={poolDetail} vaultBalance={vaultBalance} />
                );

            case "canceled":
                return <CanceledStatus poolDetail={poolDetail} />;

            default:
                return null;
        }
    };

    return (
        <Container>
            {poolDetail?.pool?.address && poolDetail?.pool?.chainId && (
                <div className="flex items-center gap-2">
                    <span className="text text-sm">Low Reward Noti</span>
                    <LowRewardNotiSwitch
                        address={poolDetail.pool.address}
                        chainId={poolDetail.pool.chainId}
                        isLowRewardNotiEnabled={poolDetail.pool.lowRewardNotiEnabled}
                    />
                </div>
            )}
            {renderContent()}
        </Container>
    );
};

export default AmountAndActivity;
