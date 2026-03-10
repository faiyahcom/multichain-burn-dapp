import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PoolDetailResponse } from "@/types/pool";
import { useGetWhitelistTokens } from "@/services/queries/queries";
import { IconArrowDownWithStem } from "@/assets/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { toast } from "@/components/common/custom-toast";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { useSystemStore } from "@/stores/systemStore";
import { useSwapPoolETH } from "./useSwapPoolETH";
import { useSwapPoolSOL } from "./useSwapPoolSOL";
import { useMemo, useState } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import { toBaseUnits } from "@/utils/helpers/numbers";
import { ArrowIcon } from "@/components/common/arrow-icon";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";

const swapFormSchema = z.object({
    burnAmount: z
        .string()
        .min(0, { message: "Burn amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Burn amount must be a positive number",
        }),
});

type SwapFormValues = z.infer<typeof swapFormSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    onSuccess: () => void;
};

const SwapDialog = ({ open, onOpenChange, poolDetail, onSuccess }: Props) => {
    const [openFeePopUp, setOpenFeePopUp] = useState(false);

    const formatBalanceDisplay = (value?: string) => {
        if (!value) return "0";

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) return value;

        return numericValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3,
        });
    };

    const handleOpenFeePopUp = () => {
        setOpenFeePopUp(!openFeePopUp);
    };
    const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

    const isSolanaNetwork = selectedNetworkId === "solanaDevnet";

    const { depositSwapPool: depositSwapPoolETH } = useSwapPoolETH();

    const { depositSwapPool: depositSwapPoolSOL } = useSwapPoolSOL();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SwapFormValues>({
        defaultValues: {
            burnAmount: "",
        },
        resolver: zodResolver(swapFormSchema),
    });

    const handleSelectPercent = (percent: number) => {
        if (!burnBalanceFormatted || poolDetail?.pool.tokenInDecimals == null) return;

        try {
            const balanceBN = new BN(
                toBaseUnits(burnBalanceFormatted, poolDetail.pool.tokenInDecimals),
            );

            if (balanceBN.isZero()) return;

            const amountBN =
                percent === 100 ? balanceBN : balanceBN.muln(percent).divn(100);

            const formatted = formatUnits(
                BigInt(amountBN.toString()),
                poolDetail.pool.tokenInDecimals,
            );

            setValue("burnAmount", formatted, { shouldValidate: true });
        } catch {
            return;
        }
    };
    const burnAmount = watch("burnAmount");

    const onSubmit = async (data: SwapFormValues) => {
        try {
            if (!poolDetail) return;

            if (isSolanaNetwork) {
                await depositSwapPoolSOL({
                    amountIn: data.burnAmount,
                    poolDetail,
                });
            } else {
                await depositSwapPoolETH({
                    poolAddress: poolDetail.pool.address,
                    amountIn: data.burnAmount,
                    // Use decimals from poolDetail directly — authoritative source.
                    // burnToken lookup can be undefined if address casing differs,
                    // which would cause parseUnits to use wrong decimals (18 instead of e.g. 9)
                    // sending 10^9× too large an amount → contract reverts InsufficientReward.
                    decimals: poolDetail.pool.tokenInDecimals,
                    tokenInAddress: poolDetail.pool.tokenIn,
                });
            }

            reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error("Swap failed", {
                description: error?.message || String(error),
            });
        }
    };

    const { data: whitelistTokens, isLoading: isLoadingWhitelistTokens } = useGetWhitelistTokens();

    const burnToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.tokenIn,
    );

    const rewardToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.rewardToken,
    );
    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;
    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.pool.tokenInSymbol,
        whitelistToken: burnToken,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.pool.rewardTokenSymbol,
        whitelistToken: rewardToken,
    });

    const {
        formatted: burnBalanceFormatted,
        symbol: burnBalanceSymbol,
        isLoading: isLoadingBurnBalance,
    } = useTokenBalance({
        tokenAddress: poolDetail?.pool.tokenIn,
        decimals: poolDetail?.pool.tokenInDecimals,
        symbol: poolDetail?.pool.tokenInSymbol,
    });

    const {
        formatted: rewardBalanceFormatted,
        symbol: rewardBalanceSymbol,
        isLoading: isLoadingRewardBalance,
    } = useTokenBalance({
        tokenAddress: poolDetail?.pool.rewardToken,
        decimals: poolDetail?.pool.rewardTokenDecimals,
        symbol: poolDetail?.pool.rewardTokenSymbol,
    });

    const formattedEstimatedRewardAmount = useMemo(() => {
        if (!burnAmount || !poolDetail) return "0";

        try {
            const {
                tokenInDecimals,
                rewardTokenDecimals,
                rewardNumerator,
                rewardDenominator,
                settlementFee,
            } = poolDetail?.pool;
            const amountInBN = toBaseUnits(burnAmount, tokenInDecimals);

            if (amountInBN.isZero()) return "0";

            const rewardNumeratorBN = new BN(rewardNumerator);
            const rewardDenominatorBN = new BN(rewardDenominator);
            const decimalDiff = rewardTokenDecimals - tokenInDecimals;

            let rewardBN: BN;

            if (decimalDiff >= 0) {
                const scaleUpBN = new BN(10).pow(new BN(decimalDiff));
                rewardBN = amountInBN
                    .mul(rewardNumeratorBN)
                    .mul(scaleUpBN)
                    .div(rewardDenominatorBN);
            } else {
                const scaleDownBN = new BN(10).pow(new BN(Math.abs(decimalDiff)));
                rewardBN = amountInBN
                    .mul(rewardNumeratorBN)
                    .div(rewardDenominatorBN.mul(scaleDownBN));
            }

            const feeBN = rewardBN
                .mul(new BN(settlementFee ?? "0"))
                .div(new BN(10000));

            const finalRewardBN = rewardBN.sub(feeBN);

            return formatUnits(BigInt(finalRewardBN.toString()), rewardTokenDecimals);
        } catch {
            return "0";
        }
    }, [burnAmount, poolDetail]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogContent
                    showCloseButton={false}
                    className="h-fit bg-mb-popover px-8 py-5 sm:max-w-fit"
                >
                    <DialogHeader>
                        <DialogTitle className="text-5xl font-semibold">SWAP</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* SELL */}
                        <div className="relative mb-10 flex w-full flex-col rounded-xl bg-mb-gray p-5">
                            <div className="flex items-center justify-between">
                                <div className="text-2xl text-greyed">Sell</div>

                                <div className="flex gap-2">
                                    {[25, 50, 75, 100].map((percent) => (
                                        <button
                                            type="button"
                                            key={percent}
                                            onClick={() => handleSelectPercent(percent)}
                                            className="rounded-full bg-mb-popover px-3 py-1 text-sm font-medium transition hover:bg-active hover:text-white"
                                        >
                                            {percent === 100 ? "Max" : `${percent}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="my-4 flex items-center justify-between">
                                <input
                                    className="bg-transparent px-0 text-[40px] font-medium text-black outline-none"
                                    aria-invalid={!!errors.burnAmount}
                                    {...register("burnAmount")}
                                />

                                {isLoadingWhitelistTokens ? (
                                    <Skeleton className="h-8 w-32 rounded" />
                                ) : (
                                    <div className="flex h-fit w-32 items-center justify-between bg-mb-popover px-4 py-1.5">
                                        <TokenImage
                                            src={burnTokenDisplay.imageUri}
                                            alt={burnTokenDisplay.name}
                                            classNames={{
                                                common: "size-6",
                                                img: "size-6",
                                                placeholder: "size-6",
                                            }}
                                        />
                                        <div className="text-xl">{burnTokenDisplay.symbol}</div>
                                    </div>
                                )}
                            </div>

                            {errors.burnAmount && (
                                <div className="mt-1 text-right text-xs text-destructive">
                                    {errors.burnAmount.message}
                                </div>
                            )}
                            {/* separator */}
                            <div className="mt-3 h-0.5 w-full bg-[linear-gradient(90deg,#FFFFFF_0%,#EAF3F7_19.71%,#EAF3F7_80.77%,#FFFFFF_100%)]" />
                            <div className="mt-1 flex w-full justify-end text-xl">
                                {isLoadingBurnBalance
                                    ? "Checking balance..."
                                    : `${formatBalanceDisplay(burnBalanceFormatted)} ${burnBalanceSymbol ?? burnTokenDisplay.symbol ?? ""
                                    }`}
                            </div>

                            <div className="absolute top-full left-1/2 flex size-15.5 -translate-x-1/2 -translate-y-2.5 items-center justify-center rounded-[10px] bg-active">
                                <IconArrowDownWithStem
                                    width={18.5}
                                    height={28.5}
                                    className="text-white opacity-100"
                                />
                            </div>
                        </div>

                        {/* BUY */}
                        <div className="flex w-full flex-col rounded-xl bg-mb-gray p-5">
                            <div className="flex justify-between">
                                <div className="text-2xl text-greyed">Buy</div>
                            </div>

                            <div className="my-4 flex items-center justify-between">
                                <input
                                    disabled
                                    className="bg-transparent px-0 text-[40px] font-medium text-black outline-none"
                                    value={formattedEstimatedRewardAmount}
                                />

                                {isLoadingWhitelistTokens ? (
                                    <Skeleton className="h-8 w-32 rounded" />
                                ) : (
                                    <div className="flex h-fit w-32 items-center justify-between bg-mb-popover px-4 py-1.5">
                                        <TokenImage
                                            src={rewardTokenDisplay.imageUri}
                                            alt={rewardTokenDisplay.name}
                                            classNames={{
                                                common: "size-6",
                                                img: "size-6",
                                                placeholder: "size-6",
                                            }}
                                        />
                                        <div className="text-xl">{rewardTokenDisplay.symbol}</div>
                                    </div>
                                )}
                            </div>
                            {/* separator */}
                            <div className="mt-3 h-0.5 w-full bg-[linear-gradient(90deg,#FFFFFF_0%,#EAF3F7_19.71%,#EAF3F7_80.77%,#FFFFFF_100%)]" />
                            <div className="mt-1 flex w-full justify-end text-xl">
                                {isLoadingRewardBalance
                                    ? "Checking balance..."
                                    : `${formatBalanceDisplay(rewardBalanceFormatted)} ${rewardBalanceSymbol ?? rewardTokenDisplay.symbol ?? ""
                                    }`}
                            </div>
                        </div>

                        <AnimateIconButton
                            iconLetter="S"
                            text="SWAP"
                            variant="letter-icon"
                            textVariant="text-container-center"
                            classNames={{
                                btn: "mt-3 bg-white w-full text-center after:text-white after:text-sm after:font-semibold after:bg-active",
                                text: "text-xl font-medium",
                                icon: "size-7.5",
                            }}
                            color="#966EFF"
                            isLoading={isSubmitting}
                            isLoadingText="Swapping..."
                            btnProps={{
                                type: "submit",
                                disabled: isSubmitting,
                            }}
                        />

                        <div className="mt-2.5 flex w-full cursor-pointer justify-between rounded-2xl bg-white px-4 text-base transition-all duration-300 hover:bg-inactive">
                            <p>{`1 ${burnTokenDisplay.symbol} = ${Number(poolDetail?.pool?.rewardNumerator) / Number(poolDetail?.pool?.rewardDenominator)} ${rewardTokenDisplay.symbol}`}</p>
                            <ArrowIcon className="rotate-90" onClick={handleOpenFeePopUp} />
                        </div>
                    </form>
                </DialogContent>
                <div
                    className={`fixed transition-all duration-300 ${openFeePopUp ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
                        }`}
                >
                    <div className="w-full rounded-2xl bg-mb-gray px-6 py-5">
                        <div className="flex justify-between text-lg text-greyed">
                            <div className="flex items-center gap-1">
                                Fee:
                                <span className="text-sm opacity-60">ⓘ</span>
                            </div>
                            <div className="font-medium text-green-500">
                                {poolDetail?.pool?.settlementFee
                                    ? `${Number(poolDetail.pool.settlementFee) / 100}%`
                                    : "Free"}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-between text-lg text-greyed">
                            <div className="flex items-center gap-1">
                                Network Fee:
                                <span className="text-sm opacity-60">ⓘ</span>
                            </div>
                            <div>{"<0.01 USD$"}</div>
                        </div>
                    </div>
                </div>
            </DialogPortal>
        </Dialog>
    );
};

export default SwapDialog;
