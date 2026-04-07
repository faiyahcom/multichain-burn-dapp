import { IconGoTo } from "@/assets/react";
import { chainIdToNetworkConfig, SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import { truncateString } from "@/utils/helpers/string";

type Props = {
    address: string;
    chainId?: string;
    className?: string;
    iconClassName?: string;
};

const ScanLink = ({ address, chainId, className, iconClassName }: Props) => {
    const networkConfig = chainId ? chainIdToNetworkConfig(chainId) : undefined;

    const href = networkConfig
        ? chainId === SOLANA_BACKEND_CHAIN_ID
            ? `${networkConfig.scanUrl}/address/${address}?cluster=devnet`
            : `${networkConfig.scanUrl}/address/${address}`
        : undefined;

    const content = (
        <>
            {truncateString({ str: address })}
            <IconGoTo className={iconClassName} />
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-baseline gap-3.5 text-base transition-colors ${className ?? ""}`}
            >
                {content}
            </a>
        );
    }

    return (
        <span className={`flex items-baseline gap-3.5 text-base ${className ?? ""}`}>
            {content}
        </span>
    );
};

export default ScanLink;
