import NetworkDisplay from "../network-display";
import TokenImage from "../token-image";

interface Props {
  tokenOutProps: React.ComponentProps<typeof TokenImage>;
  tokenInProps: React.ComponentProps<typeof TokenImage>;
  networkProps: React.ComponentProps<typeof NetworkDisplay>;
}

const TokenOutInNetworkDisplay: React.FC<Props> = ({
  tokenOutProps,
  tokenInProps,
  networkProps,
}) => {
  const { classNames: tokenOutClassNames, ...tokenOutPropsRest } =
    tokenOutProps;
  const { classNames: tokenInClassNames, ...tokenInPropsRest } = tokenInProps;
  const { classNames: networkClassNames, ...networkPropsRest } = networkProps;

  return (
    <div className="relative flex shrink-0 items-center gap-0.5 py-1.5 pr-1.5">
      <TokenImage
        {...tokenOutPropsRest}
        classNames={{
          common: "size-7 sm:size-9.75",
          ...tokenOutClassNames,
        }}
      />
      <TokenImage
        {...tokenInPropsRest}
        classNames={{
          common: "size-7 sm:size-9.75",
          ...tokenInClassNames,
        }}
      />
      <NetworkDisplay
        {...networkPropsRest}
        classNames={{
          container: "absolute right-0 bottom-0",
          img: "size-4.75 sm:size-4.75 mr-0",
          label: "sr-only",
          ...networkClassNames,
        }}
        styles={{
          img: {
            boxShadow: "-1px -1px 0px 0px #00000040",
          },
        }}
      />
    </div>
  );
};

export default TokenOutInNetworkDisplay;
