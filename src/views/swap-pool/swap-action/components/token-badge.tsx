import { Skeleton } from "@/components/ui/skeleton";
import TokenImage from "@/components/common/token-image";
import NetworkDisplay from "@/components/common/network-display";

type Props = {
    isLoading: boolean;
    imageUri?: string;
    name?: string;
    symbol?: string;
    chainId?: string;
};

const TokenBadge = ({ isLoading, imageUri, name, symbol, chainId }: Props) => {
    if (isLoading) return <Skeleton className="h-8 w-32 rounded" />;

    return (
        <div className="relative flex h-fit w-28 shrink-0 items-center justify-between gap-2 rounded-13px bg-primary-foreground px-3 py-1.5 sm:w-32 xl:w-40 xl:gap-3 xl:px-6 xl:py-2">
            <TokenImage
                src={imageUri}
                alt={name}
                classNames={{
                    common: "size-5 sm:size-6 xl:size-7.5",
                    img: "size-5 sm:size-6 xl:size-7.5",
                    placeholder: "size-5 sm:size-6 xl:size-7.5",
                }}
            />
            {chainId && (
                <NetworkDisplay
                    chainId={chainId}
                    classNames={{
                        container: "absolute left-6.5 top-4 xl:left-11.25 xl:top-6",
                        img: "size-3 sm:size-3 shadow-[-1px_0px_0px_0px_#ffffff]",
                    }}
                    hasLabel={false}
                />
            )}
            <div
                className="min-w-0 font-orbitron text-sm font-semibold text-mb-btn-swap sm:text-base xl:text-2xl"
                title={symbol}
            >
                {symbol}
            </div>
        </div>
    );
};

export default TokenBadge;
