import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import StakedRewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activities";
import AnimateIconButton from "@/components/common/animate-icon-button";
import PoolHistory from "./pool-history";
import ScanLink from "@/components/common/scan-link";
import { useOnChainVaultBalance } from "./amount-activities/hooks/useOnChainVaultBalance";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { StartsInCountdown, EndsInCountdown } from "@/components/shared/countdown";

type Props = {
    address: string;
};

const AdminStakePoolDetail = ({ address }: Props) => {
    const { data: poolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(address),
        queryFn: () => poolService.getPoolDetail(address),
        refetchInterval: 2_500,
    });

    const pool = poolDetail?.pool;
    const status = pool?.status ?? "draft";
    const statusDisplay = BURN_POOL_STATUS[status] ?? BURN_POOL_STATUS["draft"];

    // Shared on-chain vault balance — used by both StakedRewardAmount and ClosedStatus
    const vaultBalance = useOnChainVaultBalance({
        poolAddress: pool?.address,
        chainId: pool?.chainId,
        rewardToken: pool?.rewardToken,
        tokenIn: pool?.tokenIn,
        rewardTokenDecimals: pool?.rewardTokenDecimals,
        tokenInDecimals: pool?.tokenInDecimals,
        assetTypeReward: pool?.assetTypeReward,
        assetTypeIn: pool?.assetTypeIn,
    });

    const renderExtraContent = () => {
        switch (status as string) {
            case "pending":
                return pool?.timeStart ? (
                    <StartsInCountdown
                        startTime={pool.timeStart}
                        poolAddress={address}
                        className="text-xl"
                    />
                ) : null;
            case "holding":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        Pool has reached its start time but is awaiting admin action.
                    </p>
                );
            case "live":
            case "on_going":
                return pool?.timeEnd ? (
                    <EndsInCountdown
                        endTime={pool.timeEnd}
                        poolAddress={address}
                        className="text-xl"
                    />
                ) : null;
            case "closed":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool has been emergency closed by the admin.
                    </p>
                );
            case "ended":
            case "end":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool has ended. Staking is no longer possible.
                    </p>
                );
            case "canceled":
                return (
                    <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
                        This pool has been canceled.
                    </p>
                );
            default:
                return null;
        }
    };

    return (
        <div className="px-4 pt-4 md:pt-9.5 md:pr-0 md:pl-14">
            <div className="space-y-2">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <h2 className="text-3xl font-semibold">{pool?.name}</h2>
                    <AnimateIconButton
                        iconLetter={statusDisplay.letter}
                        textVariant="text-container-center"
                        text={statusDisplay.label}
                        color={statusDisplay.color}
                        hasGroupHover
                        classNames={{
                            btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
                            text: "text-2xl font-medium",
                            icon: "size-9 text-3xl",
                        }}
                    />
                    <div className="flex flex-1">{renderExtraContent()}</div>
                </div>
                <ScanLink address={pool?.address ?? ""} chainId={pool?.chainId} />
            </div>

            <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-3">
                <div className="col-span-1 lg:col-span-2">
                    <PoolOverview poolDetail={poolDetail} />
                    <StakedRewardAmount poolDetail={poolDetail} vaultBalance={vaultBalance} />
                </div>
                <div className="col-span-1">
                    <AmountAndActivity
                        poolDetail={poolDetail}
                        vaultBalance={vaultBalance}
                    />
                </div>
            </div>

            <PoolHistory poolDetail={poolDetail} />
        </div>
    );
};

export default AdminStakePoolDetail;
