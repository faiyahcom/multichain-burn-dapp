import {
  NETWORK_CONFIGS,
  chainIdToNetworkConfig,
  type NetworkConfig,
} from "@/config/networks";
import NetworkImgIcon from "./network-img-icon";
import { cn } from "@/lib/utils";

type NetworkDisplayClassNames = {
  container?: string;
  img?: string;
  label?: string;
};

type NetworkDisplayStyles = {
  container?: React.CSSProperties;
  img?: React.CSSProperties;
  label?: React.CSSProperties;
};

type CommonProps = {
  classNames?: NetworkDisplayClassNames;
  styles?: NetworkDisplayStyles;
};

type Props =
  | {
      networkId: string;
      chainId?: never;
    }
  | {
      networkId?: never;
      chainId: string;
    };

const NetworkDisplay: React.FC<Props & CommonProps> = ({
  networkId,
  chainId,
  classNames,
  styles,
}) => {
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
    <span className={classNames?.container} style={styles?.container}>
      <NetworkImgIcon
        src={networkConfig.iconSrc}
        alt={networkConfig.label}
        className={cn("mr-1.5 inline size-6 sm:size-8", classNames?.img)}
        style={styles?.img}
      />
      <span className={classNames?.label} style={styles?.label}>
        {networkConfig.label}
      </span>
    </span>
  );
};

export default NetworkDisplay;
