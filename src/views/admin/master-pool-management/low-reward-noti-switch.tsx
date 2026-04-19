import BlueSwitch from "@/components/common/blue-switch";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";

interface Props {
  address: string;
  chainId: string;
  isLowRewardNotiEnabled?: boolean;
  classNames?: {
    btn?: string;
  };
}

const LowRewardNotiSwitch: React.FC<Props> = ({
  address,
  chainId,
  isLowRewardNotiEnabled,
  classNames,
}) => {
  return (
    <PoolChainGuard chainId={chainId}>
      <BlueSwitch
        active={isLowRewardNotiEnabled}
        onClick={(e) => {
          e?.stopPropagation();
        }} // TODO: implement
        isLoading={false} // TODO: implement
        classNames={classNames}
      />
    </PoolChainGuard>
  );
};

export default LowRewardNotiSwitch;
