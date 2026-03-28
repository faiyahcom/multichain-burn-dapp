import { cn } from "@/lib/utils";
import TokenImage from "../token-image";

interface Props {
  tokenOutProps: React.ComponentProps<typeof TokenImage>;
  tokenInProps: React.ComponentProps<typeof TokenImage>;
  className?: string;
}

const TokenOutInInterceptDisplay: React.FC<Props> = ({
  tokenOutProps,
  tokenInProps,
  className,
}) => {
  const { classNames: tokenOutClassNames, ...tokenOutPropsRest } =
    tokenOutProps;
  const { classNames: tokenInClassNames, ...tokenInPropsRest } = tokenInProps;

  return (
    <div className={cn("flex min-w-0 shrink-0 items-center", className)}>
      <TokenImage
        {...tokenOutPropsRest}
        classNames={{
          common: "size-6 sm:size-8 relative z-10",
          ...tokenOutClassNames,
        }}
      />
      <TokenImage
        {...tokenInPropsRest}
        classNames={{
          common: "size-6 sm:size-8 -ml-1 relative z-0",
          ...tokenInClassNames,
        }}
      />
    </div>
  );
};

export default TokenOutInInterceptDisplay;
