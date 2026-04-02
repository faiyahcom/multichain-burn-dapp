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
        <div className="relative flex h-fit w-40 items-center justify-between gap-3 rounded-13px bg-primary-foreground px-6 py-2">
            <TokenImage
                src={imageUri}
                alt={name}
                classNames={{
                    common: "size-7.5",
                    img: "size-7.5",
                    placeholder: "size-7.5",
                }}
            />
            {chainId && (
                <NetworkDisplay
                    chainId={chainId}
                    classNames={{
                        container: "absolute left-11.25 top-6",
                        img: "size-3 sm:size-3 shadow-[-1px_0px_0px_0px_#ffffff]",
                    }}
                    hasLabel={false}
                />
            )}
            <div
                className="min-w-0 font-orbitron text-2xl font-semibold text-mb-btn-swap"
                title={symbol}
            >
                {symbol}
            </div>
        </div>
    );
};

export default TokenBadge;
