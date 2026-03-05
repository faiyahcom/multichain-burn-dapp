import {
  NETWORK_CONFIGS,
  chainIdToNetworkConfig,
  type NetworkConfig,
} from "@/config/networks";
import NetworkImgIcon from "./network-img-icon";

type Props =
  | { networkId: string; chainId?: never }
  | { networkId?: never; chainId: string };

const NetworkDisplay: React.FC<Props> = ({ networkId, chainId }) => {
  let networkConfig: NetworkConfig | undefined = undefined;
  if (networkId) {
    networkConfig = NETWORK_CONFIGS.find((network) => network.id === networkId);
  }
  if (chainId) {
    networkConfig = chainIdToNetworkConfig(chainId);
  }
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
