import BlueSwitch from "@/components/common/blue-switch";
import { toast } from "@/components/common/custom-toast";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { adminNotificationService } from "@/services/adminNotificationService";
import { adminPoolManagementQueryKeys } from "@/services/queries/queryKey";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  address: string;
  chainId: string;
  isLowRewardNotiEnabled?: boolean;
  classNames?: {
    btn?: string;
  };
  onSuccess?: () => void;
}

const LowRewardNotiSwitch: React.FC<Props> = ({
  address,
  chainId,
  isLowRewardNotiEnabled,
  classNames,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const {
    mutate: toggleLowRewardNotiMutate,
    isPending: isPendingToggleLowRewardNoti,
  } = useMutation({
    mutationFn: (newValue: boolean) =>
      adminNotificationService.toggleLowRewardNoti({
        poolAddress: address,
        enabled: newValue,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: adminPoolManagementQueryKeys.list().filter(Boolean),
        exact: false,
      });
      onSuccess?.();
      toast.success(
        `Low reward notification ${data.enabled ? "enabled" : "disabled"}`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage({ error }));
    },
  });

  const handleToggleLowRewardNoti = async () => {
    toggleLowRewardNotiMutate(!isLowRewardNotiEnabled);
  };

  return (
    <PoolChainGuard chainId={chainId}>
      <BlueSwitch
        active={isLowRewardNotiEnabled}
        onClick={(e) => {
          e?.stopPropagation();
          handleToggleLowRewardNoti();
        }}
        isLoading={isPendingToggleLowRewardNoti}
        classNames={classNames}
      />
    </PoolChainGuard>
  );
};

export default LowRewardNotiSwitch;
