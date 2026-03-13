import { Skeleton } from "@/components/ui/skeleton";
import TokenImage from "@/components/common/token-image";

type Props = {
    isLoading: boolean;
    imageUri?: string;
    name?: string;
    symbol?: string;
};

const TokenBadge = ({ isLoading, imageUri, name, symbol }: Props) => {
    if (isLoading) return <Skeleton className="h-8 w-32 rounded" />;

    return (
        <div className="flex h-fit w-32 items-center justify-between bg-mb-popover px-4 py-1.5 gap-1">
            <TokenImage
                src={imageUri}
                alt={name}
                classNames={{
                    common: "size-6",
                    img: "size-6",
                    placeholder: "size-6",
                }}
            />
            <div className="text-xl min-w-0 truncate" title={symbol}>{symbol}</div>
        </div>
    );
};

export default TokenBadge;
