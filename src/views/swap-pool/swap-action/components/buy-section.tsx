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
        <div className="flex w-full flex-col rounded-24px border-[2.5px] border-mb-dark-popover-item-border bg-mb-dark-popover-item px-8.75 py-3.75">
            <div className="flex items-center justify-between">
                <div className="font-inter text-base font-medium text-mb-gray-b8/60">
                    Buy
                </div>
            </div>

            <div className="my-4 flex items-center justify-between">
                <input
                    disabled
                    className="bg-transparent px-0 font-inter text-40px font-medium text-primary-foreground outline-none"
                    value={estimatedAmount}
                />
                <TokenBadge
                    isLoading={isLoadingWhitelistTokens}
                    {...tokenDisplay}
                    chainId={chainId}
                />
            </div>

            <div className="mt-1 h-0.5 w-full bg-mb-btn-swap/85" />
            <div className="my-2 flex w-full justify-end font-inter text-base">
                <p>{isLoadingBalance ? "Checking balance..." : balanceText}</p>
            </div>
        </div>
    );
};

export default BuySection;
