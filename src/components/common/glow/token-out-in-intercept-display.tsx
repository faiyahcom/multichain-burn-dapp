import TokenImage from "../token-image";

interface Props {
  tokenOutProps: React.ComponentProps<typeof TokenImage>;
  tokenInProps: React.ComponentProps<typeof TokenImage>;
}

const TokenOutInInterceptDisplay: React.FC<Props> = ({
  tokenOutProps,
  tokenInProps,
}) => {
  const { classNames: tokenOutClassNames, ...tokenOutPropsRest } =
    tokenOutProps;
  const { classNames: tokenInClassNames, ...tokenInPropsRest } = tokenInProps;

  return (
    <div className="flex min-w-0 shrink-0 items-center">
      <TokenImage
        {...tokenOutPropsRest}
        classNames={{
          common: "size-6 sm:size-8",
          ...tokenOutClassNames,
        }}
      />
      <TokenImage
        {...tokenInPropsRest}
        classNames={{
          common: "size-6 sm:size-8 -ml-1",
          ...tokenInClassNames,
        }}
      />
    </div>
  );
};

export default TokenOutInInterceptDisplay;
