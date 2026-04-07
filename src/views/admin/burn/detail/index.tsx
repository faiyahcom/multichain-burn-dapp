import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PoolOverview from "./pool-overview";
import RewardAmount from "./reward-amount";
import AmountAndActivity from "./amount-activities";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import AnimateIconButton from "@/components/common/animate-icon-button";
import type { BurnPoolStatus } from "@/types/pool";
import PoolHistory from "./pool-history";
import ScanLink from "@/components/common/scan-link";
import { useOnChainVaultBalance } from "./amount-activities/hooks/useOnChainVaultBalance";

type Props = {
  address: string;
};

const AdminBurnPoolDetail = ({ address }: Props) => {
  const { data: poolDetail } = useQuery({
    queryKey: poolQueryKeys.detail(address),
    queryFn: () => poolService.getPoolDetail(address),
  });

  const pool = poolDetail?.pool;
  const status = pool?.status;
  const safeStatus: BurnPoolStatus = status ?? "on_going";

  const queryClient = useQueryClient();

  // Shared on-chain vault balance — used by both RewardAmount and ClosedStatus
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
    if (!status) return null;

    switch (status) {
      case "pending":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            This pool is waiting for admin approval.
          </p>
        );
      case "upcoming":
        return (
          // <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
          //     This pool is waiting for admin approval.
          // </p>
          <></>
        );
      case "holding":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            Pool has reached its start time but is awaiting admin action.
          </p>
        );
      case "on_going":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            This pool is currently active. Users can participate until the end
            time.
          </p>
        );
      case "closed":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            This pool has been emergency closed by the admin.
          </p>
        );
      case "ended":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            This pool has ended. Participation is no longer possible.
          </p>
        );
      case "canceled":
        return (
          <p className="ml-auto rounded-md bg-admin-warning px-6 py-2 text-base">
            This pool has been manually canceled by the Project Owner.
          </p>
        );
      case "draft":
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pt-4 md:pt-9.5 md:pr-0 md:pl-14">
      <div className="space-y-2">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <h2 className="text-3xl font-semibold">{poolDetail?.pool?.name}</h2>
          <AnimateIconButton
            iconLetter={BURN_POOL_STATUS[safeStatus]?.letter}
            textVariant="text-container-center"
            text={BURN_POOL_STATUS[safeStatus]?.label}
            color={BURN_POOL_STATUS[safeStatus]?.color}
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
          <PoolOverview
            poolDetail={poolDetail}
            onPartnerToggleSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(address),
              })
            }
          />
          <RewardAmount poolDetail={poolDetail} vaultBalance={vaultBalance} />
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

export default AdminBurnPoolDetail;
