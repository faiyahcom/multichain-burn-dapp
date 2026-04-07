import TokenBadge from "./token-badge";

type TokenDisplay = { imageUri?: string; name?: string; symbol?: string };

type Props = {
    tokenDisplay: TokenDisplay;
    isLoadingWhitelistTokens: boolean;
    estimatedAmount: string;
    isLoadingBalance: boolean;
    balanceText: string;
    chainId?: string;
};

const BuySection = ({
    tokenDisplay,
    isLoadingWhitelistTokens,
    estimatedAmount,
    isLoadingBalance,
    balanceText,
    chainId,
}: Props) => {
    return (
        <div className="flex w-full flex-col rounded-24px border-[2.5px] border-mb-dark-popover-item-border bg-mb-dark-popover-item px-4 py-3 xl:px-8.75 xl:py-3.75">
            <div className="flex items-center justify-between">
                <div className="font-inter text-sm font-medium text-mb-gray-b8/60 xl:text-base">
                    Buy
                </div>
            </div>

            <div className="my-2 flex items-center justify-between xl:my-4">
                <input
                    disabled
                    className="min-w-0 flex-1 bg-transparent px-0 font-inter text-2xl font-medium text-primary-foreground outline-none sm:text-3xl xl:text-40px"
                    value={estimatedAmount}
                />
                <TokenBadge
                    isLoading={isLoadingWhitelistTokens}
                    {...tokenDisplay}
                    chainId={chainId}
                />
            </div>

            <div className="mt-1 h-0.5 w-full bg-mb-btn-swap/85" />
            <div className="my-2 flex w-full flex-wrap justify-end gap-y-0.5 font-inter text-xs sm:text-sm xl:text-base">
                <p>{isLoadingBalance ? "Checking balance..." : balanceText}</p>
            </div>
        </div>
    );
};

export default BuySection;
