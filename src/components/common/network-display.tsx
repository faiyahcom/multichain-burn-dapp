import { NETWORK_CONFIGS } from "@/config/networks";
import NetworkImgIcon from "./network-img-icon";

interface Props {
  networkId: string;
}

const NetworkDisplay: React.FC<Props> = ({ networkId }) => {
  const networkConfig = NETWORK_CONFIGS.find(
    (network) => network.id === networkId,
  );
  if (!networkConfig) {
    return null;
  }

  return (
    <span>
      <NetworkImgIcon
        src={networkConfig.iconSrc}
        alt={networkConfig.label}
        className="mr-1.5 inline size-4.75"
      />
      <span>{networkConfig.label}</span>
    </span>
  );
};

export default NetworkDisplay;
