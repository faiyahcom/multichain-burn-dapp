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
import { toast } from "@/components/common/custom-toast";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { useSystemStore } from "@/stores/systemStore";
import { useSwapPoolETH } from "./hooks/useSwapPoolETH";
import { useSwapPoolSOL } from "./hooks/useSwapPoolSOL";
import { useMemo, useState } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { getErrorMessage } from "@/utils/helpers/error-message";
import SellSection from "./components/sell-section";
import BuySection from "./components/buy-section";
import FeePanel from "./components/fee-panel";
import SwapRateRow from "./components/swap-rate-row";
import { parseUnits } from "ethers";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import { safeDecimalParse, shortenNumber } from "@/utils/helpers/numbers";
import { useDebounceValue } from "usehooks-ts";
import { DECIMAL_FEE_PERCENT } from "@/views/admin/fee-settings-management/hooks/useFeeSettings";
import { cn } from "@/lib/utils";
import {
    getVariantBorderClassName,
    getVariantShadowClassName,
} from "@/components/common/glow/container";
import { IconSwapCategory } from "@/assets/react";
import { Button } from "@/components/common/glow/button";

const swapFormSchema = z.object({
    burnAmount: z
        .string()
        .min(0, { message: "Burn amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Burn amount must be a positive number",
        })
        .refine(
            (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal && decimal?.decimalPlaces() <= 6;
            },
            {
                message: "Burn amount must have 6 decimals or less",
            },
        ),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;

const SELL_INPUT_DEBOUNCE_MS = 500;

const formatBalanceDisplay = (value?: string) => {
    if (!value) return "0";
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return value;
    return String(shortenNumber({ number: numericValue }));
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    poolAddress?: string;
    onSuccess: () => void;
};

const SwapDialog = ({
    open,
    onOpenChange,
    poolDetail: poolDetailProp,
    poolAddress,
    onSuccess,
}: Props) => {
    const { data: fetchedPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(poolAddress!),
        queryFn: () => poolService.getPoolDetail(poolAddress!),
        enabled: !poolDetailProp && !!poolAddress,
    });

    const poolDetail = poolDetailProp ?? fetchedPoolDetail;

    const [openFeePopUp, setOpenFeePopUp] = useState(false);

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
        defaultValues: { burnAmount: "" },
        resolver: zodResolver(swapFormSchema),
    });

    const burnAmount = watch("burnAmount");
    const [debouncedBurnAmount] = useDebounceValue(
        burnAmount,
        SELL_INPUT_DEBOUNCE_MS,
    );
    const derivedBurnAmount = burnAmount ? debouncedBurnAmount : burnAmount;
    const isSellAmountDebouncing =
        !!burnAmount && burnAmount !== derivedBurnAmount;

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const {
        formatted: burnBalanceFormatted,
        symbol: burnBalanceSymbol,
        isLoading: isLoadingBurnBalance,
        refetch: refetchBurnBalance,
    } = useTokenBalance({
        tokenAddress: poolDetail?.pool.tokenIn,
        decimals: poolDetail?.pool.tokenInDecimals,
        symbol: poolDetail?.pool.tokenInSymbol,
    });

    const {
        formatted: rewardBalanceFormatted,
        symbol: rewardBalanceSymbol,
        isLoading: isLoadingRewardBalance,
        refetch: refetchRewardBalance,
    } = useTokenBalance({
        tokenAddress: poolDetail?.pool.rewardToken,
        decimals: poolDetail?.pool.rewardTokenDecimals,
        symbol: poolDetail?.pool.rewardTokenSymbol,
    });

    const handleSelectPercent = (percent: number) => {
        if (!burnBalanceFormatted || poolDetail?.pool.tokenInDecimals == null)
            return;
        try {
            const decimals = poolDetail.pool.tokenInDecimals;
            const balanceBN = new BN(
                parseUnits(burnBalanceFormatted, decimals).toString(),
            );
            if (balanceBN.isZero()) return;
            let amountBN =
                percent === 100 ? balanceBN : balanceBN.muln(percent).divn(100);
            if (maxBurnLeft && maxBurnLeft !== "0") {
                const maxBurnRawBN = new BN(
                    parseUnits(maxBurnLeft, decimals).toString(),
                );
                if (amountBN.gt(maxBurnRawBN)) {
                    amountBN = maxBurnRawBN;
                }
            }
            const formatted = formatUnits(BigInt(amountBN.toString()), decimals);
            setValue("burnAmount", formatted, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const maxBurnLeft = useMemo(() => {
        if (!poolDetail) return "0";
        try {
            const numeratorBN = new BN(poolDetail.pool.rewardNumerator ?? "0");
            const denominatorBN = new BN(poolDetail.pool.rewardDenominator ?? "0");
            if (numeratorBN.isZero() || denominatorBN.isZero()) return "0";
            const rewardDecimals = poolDetail.pool.rewardTokenDecimals;
            const burnDecimals = poolDetail.pool.tokenInDecimals;
            const rewardAmountBN = new BN(poolDetail.rewardAmount ?? "0");
            const rewardDecimalsBN = new BN(10).pow(new BN(rewardDecimals));
            const burnDecimalsBN = new BN(10).pow(new BN(burnDecimals));
            const maxBurnRaw = rewardAmountBN
                .mul(denominatorBN)
                .mul(burnDecimalsBN)
                .div(numeratorBN.mul(rewardDecimalsBN));
            const depositedBN = new BN(poolDetail.depositedAmount ?? "0");
            const remaining = maxBurnRaw.sub(depositedBN);
            if (remaining.isNeg()) return "0";
            return formatUnits(BigInt(remaining.toString()), burnDecimals);
        } catch {
            return "0";
        }
    }, [poolDetail]);

    const isExceedingMax =
        !!derivedBurnAmount &&
        Number(derivedBurnAmount) > 0 &&
        Number(maxBurnLeft) > 0 &&
        Number(derivedBurnAmount) > Number(maxBurnLeft);

    const insufficientBalanceMessage = useMemo(() => {
        if (!derivedBurnAmount || !burnBalanceFormatted || isLoadingBurnBalance) {
            return undefined;
        }

        const burnAmountDecimal = safeDecimalParse({ value: derivedBurnAmount });
        const burnBalanceDecimal = safeDecimalParse({
            value: burnBalanceFormatted,
        });

        if (!burnAmountDecimal || !burnBalanceDecimal) return undefined;
        if (burnAmountDecimal.lte(0) || burnAmountDecimal.lte(burnBalanceDecimal)) {
            return undefined;
        }

        return `Amount exceeds wallet balance (${formatBalanceDisplay(burnBalanceFormatted)} ${burnTokenDisplay?.symbol ?? ""})`;
    }, [
        derivedBurnAmount,
        burnBalanceFormatted,
        burnBalanceSymbol,
        burnTokenDisplay?.symbol,
        isLoadingBurnBalance,
    ]);

    const isInsufficientBalance = !!insufficientBalanceMessage;

    const formattedEstimatedRewardAmount = useMemo(() => {
        if (!derivedBurnAmount || !poolDetail) return "0";

        try {
            const {
                tokenInDecimals,
                rewardTokenDecimals,
                rewardNumerator,
                rewardDenominator,
                settlementFee,
            } = poolDetail.pool;

            const amountInBN = new BN(
                parseUnits(derivedBurnAmount || "0", tokenInDecimals).toString(),
            );

            if (amountInBN.isZero()) return "0";

            const numeratorBN = new BN(rewardNumerator);
            const denominatorBN = new BN(rewardDenominator);

            const rewardDecimalsBN = new BN(10).pow(new BN(rewardTokenDecimals));
            const tokenDecimalsBN = new BN(10).pow(new BN(tokenInDecimals));

            const rewardBN = amountInBN
                .mul(numeratorBN)
                .mul(rewardDecimalsBN)
                .div(denominatorBN.mul(tokenDecimalsBN));

            const feeBN = rewardBN
                .mul(new BN(settlementFee ?? "0"))
                .div(new BN(DECIMAL_FEE_PERCENT));

            const finalReward = rewardBN.sub(feeBN);

            const formatted = formatUnits(
                BigInt(finalReward.toString()),
                rewardTokenDecimals,
            );
            const num = Number(formatted);
            if (!Number.isFinite(num)) return formatted;
            return String(shortenNumber({ number: num }));
        } catch {
            return "0";
        }
    }, [derivedBurnAmount, poolDetail]);

    const onSubmit = async (data: SwapFormValues) => {
        try {
            if (!poolDetail) return;
            if (isSolanaNetwork) {
                await depositSwapPoolSOL({ amountIn: data.burnAmount, poolDetail });
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
            refetchBurnBalance();
            refetchRewardBalance();
            reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            toast.error("Swap failed", {
                description: getErrorMessage({ error }),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogContent
                    showCloseButton={false}
                    className={cn(
                        getVariantBorderClassName({ variant: "swap" }),
                        getVariantShadowClassName({ variant: "swap" }),
                        "h-fit border-4 bg-mb-dark-popover px-8 py-5 sm:max-w-fit",
                    )}
                >
                    <DialogHeader>
                        <DialogTitle className="text-40px font-bold">
                            <p className="inline-flex items-center">
                                <IconSwapCategory className="size-16" />
                                TOKEN SWAP
                            </p>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <SellSection
                            tokenDisplay={burnTokenDisplay}
                            isLoadingWhitelistTokens={!poolDetail}
                            register={register}
                            errors={errors}
                            onSelectPercent={handleSelectPercent}
                            isLoadingBalance={isLoadingBurnBalance}
                            balanceText={`${formatBalanceDisplay(burnBalanceFormatted.toUpperCase())} ${burnTokenDisplay?.symbol ?? ""}`}
                            poolDetail={poolDetail}
                            maxBurnLeft={maxBurnLeft}
                            isExceedingMax={isExceedingMax}
                            insufficientBalanceMessage={insufficientBalanceMessage}
                            chainId={poolDetail?.pool.chainId}
                        />

                        <BuySection
                            tokenDisplay={rewardTokenDisplay}
                            isLoadingWhitelistTokens={!poolDetail}
                            estimatedAmount={formattedEstimatedRewardAmount}
                            isLoadingBalance={isLoadingRewardBalance}
                            balanceText={`${formatBalanceDisplay(rewardBalanceFormatted)} ${rewardTokenDisplay?.symbol ?? ""}`}
                            chainId={poolDetail?.pool.chainId}
                        />
                        <Button
                            variant="swap"
                            className="mt-4 w-full text-2xl"
                            hasHover
                            isLoading={isSubmitting}
                            disabled={
                                isSubmitting ||
                                isSellAmountDebouncing ||
                                isExceedingMax ||
                                isInsufficientBalance
                            }
                            type="submit"
                        >
                            {isSubmitting ? "Swapping..." : "Swap"}
                        </Button>

                        <SwapRateRow
                            burnSymbol={burnTokenDisplay.symbol}
                            rewardSymbol={rewardTokenDisplay.symbol}
                            rewardNumerator={poolDetail?.pool?.rewardNumerator}
                            rewardDenominator={poolDetail?.pool?.rewardDenominator}
                            onToggle={() => setOpenFeePopUp(!openFeePopUp)}
                        />
                    </form>
                </DialogContent>

                <FeePanel
                    open={openFeePopUp}
                    settlementFee={poolDetail?.pool?.settlementFee}
                />
            </DialogPortal>
        </Dialog>
    );
};

export default SwapDialog;
