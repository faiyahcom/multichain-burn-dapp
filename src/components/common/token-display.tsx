import { cn } from "@/lib/utils";
import TokenImage from "./token-image";

interface ITokenDisplay {
  customSymbol?: string;
  imageUri?: string;
  symbol: string;
  className?: string;
  classNames?: {
    container?: string;
    img?: string;
  };
}

function TokenDisplay({
  symbol,
  customSymbol,
  imageUri,
  className,
  classNames,
}: ITokenDisplay) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1",
        classNames?.container,
      )}
    >
      <TokenImage
        src={imageUri}
        alt={customSymbol ?? symbol}
        classNames={{
          common: cn(
            "size-4.75 shrink-0 rounded-full object-cover",
            className,
            classNames?.img,
          ),
        }}
      />
      <span>{customSymbol ?? symbol}</span>
    </div>
  );
}

export default TokenDisplay;
