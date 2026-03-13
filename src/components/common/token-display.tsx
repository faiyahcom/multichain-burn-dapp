import { cn } from "@/lib/utils";
import TokenImage from "./token-image";

interface ITokenDisplay {
  customSymbol?: string;
  imageUri?: string;
  symbol: string;
  className?: string;
}

function TokenDisplay({
  symbol,
  customSymbol,
  imageUri,
  className,
}: ITokenDisplay) {
  return (
    <div className="flex items-center justify-center gap-1">
      <TokenImage
        src={imageUri}
        alt={customSymbol ?? symbol}
        classNames={{
          common: cn(
            "mr-1.5 size-4.75 shrink-0 rounded-full object-cover",
            className,
          ),
        }}
      />
      <span>{customSymbol ?? symbol}</span>
    </div>
  );
}

export default TokenDisplay;
