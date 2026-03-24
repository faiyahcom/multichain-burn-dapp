import BlueSwitch from "@/components/common/blue-switch";
import { toast } from "@/components/common/custom-toast";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  address: string;
  isPartner: boolean;
  classNames?: {
    btn?: string;
  };
}

const PartnerBurnSwitch: React.FC<Props> = ({ address, isPartner, classNames }) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (newValue: boolean) =>
      poolService.togglePartnerPool(address, newValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: poolQueryKeys.all });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage({ error, fallbackMsg: "Failed to update partner status" }),
      );
    },
  });

  return (
    <BlueSwitch
      active={isPartner}
      onClick={() => mutate(!isPartner)}
      isLoading={isPending}
      classNames={classNames}
    />
  );
};

export default PartnerBurnSwitch;
