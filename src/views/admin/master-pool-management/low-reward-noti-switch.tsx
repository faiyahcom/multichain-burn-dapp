import BlueSwitch from "@/components/common/blue-switch";

interface Props {
  address: string;
  isLowRewardNotiEnabled?: boolean;
  classNames?: {
    btn?: string;
  };
}

const LowRewardNotiSwitch: React.FC<Props> = ({
  address,
  isLowRewardNotiEnabled,
  classNames,
}) => {
  return (
    <BlueSwitch
      active={isLowRewardNotiEnabled}
      onClick={() => {}} // TODO: implement
      isLoading={false} // TODO: implement
      classNames={classNames}
    />
  );
};

export default LowRewardNotiSwitch;
