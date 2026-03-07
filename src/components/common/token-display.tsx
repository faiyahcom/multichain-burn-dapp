import { cn } from "@/lib/utils";

interface ITokenDisplay {
    customSymbol?: string
    imageUri?: string
    symbol: string
    className?: string
}

function TokenDisplay({ symbol, customSymbol, imageUri, className }: ITokenDisplay) {
    return (
        <span>
            <img
                src={imageUri}
                className={cn("mr-1.5 inline size-4.75 shrink-0 rounded-full object-cover", className)}
            />
            <span>{customSymbol ?? symbol}</span>
        </span>
    );
}

export default TokenDisplay