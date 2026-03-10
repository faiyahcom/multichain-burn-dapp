import TokenBadge from "./token-badge";

type TokenDisplay = { imageUri?: string; name?: string; symbol?: string };

type Props = {
    tokenDisplay: TokenDisplay;
    isLoadingWhitelistTokens: boolean;
    estimatedAmount: string;
    isLoadingBalance: boolean;
    balanceText: string;
};

const BuySection = ({
    tokenDisplay,
    isLoadingWhitelistTokens,
    estimatedAmount,
    isLoadingBalance,
    balanceText,
}: Props) => (
    <div className="flex w-full flex-col rounded-xl bg-mb-gray p-5">
        <div className="flex justify-between">
            <div className="text-2xl text-greyed">Buy</div>
        </div>

        <div className="my-4 flex items-center justify-between">
            <input
                disabled
                className="bg-transparent px-0 text-40px font-medium text-black outline-none"
                value={estimatedAmount}
            />
            <TokenBadge isLoading={isLoadingWhitelistTokens} {...tokenDisplay} />
        </div>

        <div className="mt-3 h-0.5 w-full bg-[linear-gradient(90deg,#FFFFFF_0%,#EAF3F7_19.71%,#EAF3F7_80.77%,#FFFFFF_100%)]" />
        <div className="mt-1 flex w-full justify-end text-xl">
            {isLoadingBalance ? "Checking balance..." : balanceText}
        </div>
    </div>
);

export default BuySection;
