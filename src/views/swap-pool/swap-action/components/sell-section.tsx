import type { FieldErrors } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { shortenNumber } from "@/utils/helpers/numbers";
import TokenBadge from "./token-badge";
import type { PoolDetailResponse } from "@/types/pool";

type SwapFormValues = { burnAmount: string };
type TokenDisplay = { imageUri?: string; name?: string; symbol?: string };

type Props = {
    tokenDisplay: TokenDisplay;
    isLoadingWhitelistTokens: boolean;
    errors: FieldErrors<SwapFormValues>;
    onSelectPercent: (percent: number) => void;
    isLoadingBalance: boolean;
    balanceText: string;
    poolDetail?: PoolDetailResponse;
    maxBurnLeft: string;
    isExceedingMax: boolean;
    insufficientBalanceMessage?: string;
    chainId?: string;
    burnAmount: string;
    onBurnAmountChange: (value: string) => void;
    onBurnAmountBlur?: () => void;
};

const SellSection = ({
    tokenDisplay,
    isLoadingWhitelistTokens,
    errors,
    onSelectPercent,
    isLoadingBalance,
    balanceText,
    maxBurnLeft,
    isExceedingMax,
    insufficientBalanceMessage,
    chainId,
    burnAmount,
    onBurnAmountChange,
    onBurnAmountBlur,
}: Props) => {
    return (
        <div className="relative mb-4 flex w-full flex-col rounded-24px border-[0.156rem] border-mb-dark-popover-item-border bg-mb-dark-popover-item px-4 py-3 xl:px-8.75 xl:py-3.75">
            <div className="flex items-center justify-between">
                <div className="font-inter text-sm font-medium text-mb-gray-b8/60 xl:text-base">
                    From
                </div>
                <div className="flex gap-0.5 py-1 xl:py-1.25">
                    {[25, 50, 75, 100].map((percent) => (
                        <button
                            type="button"
                            key={percent}
                            onClick={() => onSelectPercent(percent)}
                            className="rounded-full bg-primary-foreground px-2 py-0.5 font-orbitron text-11px font-semibold text-mb-btn-swap transition hover:bg-mb-btn-swap hover:text-white xl:px-[0.719rem] xl:py-1 xl:text-13px"
                        >
                            {percent === 100 ? "Max" : `${percent}%`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="my-2 flex items-center justify-between xl:my-4">
                <NumericFormat
                    value={burnAmount}
                    onBlur={onBurnAmountBlur}
                    className="min-w-0 flex-1 bg-transparent px-0 font-inter text-2xl font-medium text-primary-foreground outline-none sm:text-3xl xl:text-40px"
                    aria-invalid={
                        !!errors.burnAmount ||
                        isExceedingMax ||
                        !!insufficientBalanceMessage
                    }
                    thousandSeparator=","
                    decimalSeparator="."
                    allowNegative={false}
                    decimalScale={6}
                    placeholder="0.0"
                    onValueChange={(values, sourceInfo) => {
                        if (sourceInfo.source === "event") {
                            onBurnAmountChange(values.value);
                        }
                    }}
                />
                <TokenBadge
                    isLoading={isLoadingWhitelistTokens}
                    {...tokenDisplay}
                    chainId={chainId}
                />
            </div>

            {errors.burnAmount && (
                <div className="mt-1 font-inter text-right text-xs text-destructive">
                    {errors.burnAmount.message}
                </div>
            )}
            {insufficientBalanceMessage && (
                <div className="mt-1 font-inter text-right text-xs text-destructive">
                    {insufficientBalanceMessage}
                </div>
            )}
            {isExceedingMax && (
                <div className="mt-1 font-inter text-right text-xs text-destructive">
                    Amount exceeds pool limit (
                    {shortenNumber({ number: Number(maxBurnLeft) })}{" "}
                    {tokenDisplay.symbol ?? ""})
                </div>
            )}

            <div className="mt-1 h-0.5 w-full bg-mb-btn-swap/85" />
            <div className="my-2 flex w-full flex-wrap justify-between gap-y-0.5 font-inter text-xs sm:text-sm xl:text-base">
                <p className="flex gap-1">
                    Max swapable: {shortenNumber({ number: Number(maxBurnLeft) })}{" "}
                    {tokenDisplay.symbol ?? ""}
                    <span className="text-mb-gray-b8/60">(Pool limit)</span>
                </p>
                <p className="">
                    {isLoadingBalance ? "Checking balance..." : balanceText}
                </p>
            </div>
        </div>
    );
};

export default SellSection;
