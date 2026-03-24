import BlueSwitch from "@/components/common/blue-switch";
import { toast } from "@/components/common/custom-toast";
import { poolService } from "@/services/poolService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useMutation } from "@tanstack/react-query";

interface Props {
  address: string;
  isPartner?: boolean;
  onSuccess?: () => void;
  classNames?: {
    btn?: string;
  };
}

const PartnerBurnSwitch: React.FC<Props> = ({
  address,
  isPartner,
  onSuccess,
  classNames,
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (newValue: boolean) =>
      poolService.togglePartnerPool(address, newValue),
    onSuccess,
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
