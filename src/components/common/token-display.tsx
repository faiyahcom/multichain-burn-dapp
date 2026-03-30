import { cn } from "@/lib/utils";
import TokenImage from "./token-image";
import { isNativeTokenSymbol } from "@/hooks/useTokenBalance";
import { NETWORK_CONFIGS } from "@/config/networks";

interface ITokenDisplay {
  customSymbol?: string;
  imageUri?: string;
  symbol: string;
  className?: string;
  classNames?: {
    container?: string;
    img?: string;
  };
  hasSymbol?: boolean;
}

function TokenDisplay({
  symbol,
  customSymbol,
  imageUri,
  className,
  classNames,
  hasSymbol = true,
}: ITokenDisplay) {
  const resolveImgSrc = () => {
    if (!imageUri && !customSymbol) {
      if (isNativeTokenSymbol(symbol)) {
        return NETWORK_CONFIGS.find((config) => config.shortLabel === symbol)
          ?.iconSrc;
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1",
        classNames?.container,
      )}
    >
      <TokenImage
        src={resolveImgSrc() ?? imageUri}
        alt={customSymbol ?? symbol}
        classNames={{
          common: cn(
            "size-4.75 shrink-0 rounded-full object-cover",
            className,
            classNames?.img,
          ),
        }}
      />
      {hasSymbol && <span>{customSymbol ?? symbol}</span>}
    </div>
  );
}

export default TokenDisplay;
