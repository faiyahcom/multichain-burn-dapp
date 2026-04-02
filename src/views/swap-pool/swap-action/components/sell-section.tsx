import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { shortenNumber } from "@/utils/helpers/numbers";
import { IconArrowDownWithStem } from "@/assets/react";
import TokenBadge from "./token-badge";
import type { PoolDetailResponse } from "@/types/pool";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";

type SwapFormValues = { burnAmount: string };
type TokenDisplay = { imageUri?: string; name?: string; symbol?: string };

type Props = {
    tokenDisplay: TokenDisplay;
    isLoadingWhitelistTokens: boolean;
    register: UseFormRegister<SwapFormValues>;
    errors: FieldErrors<SwapFormValues>;
    onSelectPercent: (percent: number) => void;
    isLoadingBalance: boolean;
    balanceText: string;
    poolDetail?: PoolDetailResponse;
    maxBurnLeft: string;
    isExceedingMax: boolean;
    insufficientBalanceMessage?: string;
    chainId?: string;
};

const SellSection = ({
    tokenDisplay,
    isLoadingWhitelistTokens,
    register,
    errors,
    onSelectPercent,
    isLoadingBalance,
    balanceText,
    maxBurnLeft,
    isExceedingMax,
    insufficientBalanceMessage,
    chainId,
}: Props) => {
    return (
        <div className="relative mb-4 flex w-full flex-col rounded-24px border-[2.5px] border-mb-dark-popover-item-border bg-mb-dark-popover-item px-8.75 py-3.75">
            <div className="flex items-center justify-between">
                <div className="font-inter text-base font-medium text-mb-gray-b8/60">
                    From
                </div>
                <div className="flex gap-0.5 py-1.25">
                    {[25, 50, 75, 100].map((percent) => (
                        <button
                            type="button"
                            key={percent}
                            onClick={() => onSelectPercent(percent)}
                            className="rounded-full bg-primary-foreground px-[11.5px] py-1 font-orbitron text-13px font-semibold text-mb-btn-swap transition hover:bg-mb-btn-swap hover:text-white"
                        >
                            {percent === 100 ? "Max" : `${percent}%`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="my-4 flex items-center justify-between">
                <input
                    className="bg-transparent px-0 font-inter text-40px font-medium text-primary-foreground outline-none"
                    aria-invalid={
                        !!errors.burnAmount ||
                        isExceedingMax ||
                        !!insufficientBalanceMessage
                    }
                    {...register("burnAmount")}
                    type="number"
                    step={DEFAULT_INPUT_NUMBER_STEP}
                />
                <TokenBadge
                    isLoading={isLoadingWhitelistTokens}
                    {...tokenDisplay}
                    chainId={chainId}
                />
            </div>

            {errors.burnAmount && (
                <div className="mt-1 text-right text-xs text-destructive">
                    {errors.burnAmount.message}
                </div>
            )}
            {insufficientBalanceMessage && (
                <div className="mt-1 text-right text-xs text-destructive">
                    {insufficientBalanceMessage}
                </div>
            )}
            {isExceedingMax && (
                <div className="mt-1 text-right text-xs text-destructive">
                    Amount exceeds pool limit (
                    {shortenNumber({ number: Number(maxBurnLeft) })}{" "}
                    {tokenDisplay.symbol ?? ""})
                </div>
            )}

            <div className="mt-1 h-0.5 w-full bg-mb-btn-swap/85" />
            <div className="my-2 flex w-full justify-between font-inter text-base">
                <p className="flex gap-1">
                    Max swapable: {shortenNumber({ number: Number(maxBurnLeft) })}{" "}
                    {tokenDisplay.symbol ?? ""}
                    <span className="text-mb-gray-b8/60">(Pool limit)</span>
                </p>
                <p className="">
                    {isLoadingBalance ? "Checking balance..." : balanceText}
                </p>
            </div>

            {/* <div className="absolute top-full left-1/2 flex size-15.5 -translate-x-1/2 -translate-y-2.5 items-center justify-center rounded-[10px] bg-active">
                <IconArrowDownWithStem
                    width={18.5}
                    height={28.5}
                    className="text-white opacity-100"
                />
            </div> */}
        </div>
    );
};

export default SellSection;
