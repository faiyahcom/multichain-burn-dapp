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
}: Props) => {
    return (
        <div className="relative mb-10 flex w-full flex-col rounded-xl bg-mb-gray p-5">
            <div className="flex items-center justify-between">
                <div className="text-2xl text-greyed">Sell</div>
                <div className="flex gap-2">
                    {[25, 50, 75, 100].map((percent) => (
                        <button
                            type="button"
                            key={percent}
                            onClick={() => onSelectPercent(percent)}
                            className="rounded-full bg-mb-popover px-3 py-1 text-sm font-medium transition hover:bg-active hover:text-white"
                        >
                            {percent === 100 ? "Max" : `${percent}%`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="my-4 flex items-center justify-between">
                <input
                    className="bg-transparent px-0 text-40px font-medium text-black outline-none"
                    aria-invalid={
                        !!errors.burnAmount ||
                        isExceedingMax ||
                        !!insufficientBalanceMessage
                    }
                    {...register("burnAmount")}
                    type="number"
                    step={DEFAULT_INPUT_NUMBER_STEP}
                />
                <TokenBadge isLoading={isLoadingWhitelistTokens} {...tokenDisplay} />
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
                    Amount exceeds pool limit ({shortenNumber({ number: Number(maxBurnLeft) })} {tokenDisplay.symbol ?? ""})
                </div>
            )}

            <div className="mt-3 h-0.5 w-full bg-[linear-gradient(90deg,#FFFFFF_0%,#EAF3F7_19.71%,#EAF3F7_80.77%,#FFFFFF_100%)]" />
            <div className="mt-1 flex w-full justify-between text-xl">
                <p className="text-sm">Max swapable: {shortenNumber({ number: Number(maxBurnLeft) })} {tokenDisplay.symbol ?? ""} (Pool limit)</p>
                <p>{isLoadingBalance ? "Checking balance..." : balanceText}</p>
            </div>

            <div className="absolute top-full left-1/2 flex size-15.5 -translate-x-1/2 -translate-y-2.5 items-center justify-center rounded-[10px] bg-active">
                <IconArrowDownWithStem
                    width={18.5}
                    height={28.5}
                    className="text-white opacity-100"
                />
            </div>
        </div>
    )
};

export default SellSection;
