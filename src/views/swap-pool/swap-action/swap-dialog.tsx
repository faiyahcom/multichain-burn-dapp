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
import AnimateIconButton from "@/components/common/animate-icon-button";
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
import { safeDecimalParse } from "@/utils/helpers/numbers";

const swapFormSchema = z.object({
    burnAmount: z
        .string()
        .min(0, { message: "Burn amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Burn amount must be a positive number",
        })
        .refine((value) => {
            const decimal = safeDecimalParse({ value });
            return decimal && decimal?.decimalPlaces() <= 6;
        }, {
            message: "Burn amount must have 6 decimals or less",
        }),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;

const formatBalanceDisplay = (value?: string) => {
    if (!value) return "0";
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return value;
    return numericValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    poolAddress?: string;
    onSuccess: () => void;
};

const SwapDialog = ({ open, onOpenChange, poolDetail: poolDetailProp, poolAddress, onSuccess }: Props) => {
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

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const burnTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.tokenIn,
        tokenSymbol: poolDetail?.tokenIn.symbol,
        tokenName: poolDetail?.tokenIn.name,
        customName: poolDetail?.tokenIn.customName,
        customSymbol: poolDetail?.tokenIn.customSymbol,
        imageUri: poolDetail?.tokenIn.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool.rewardToken,
        tokenSymbol: poolDetail?.tokenOut.symbol,
        tokenName: poolDetail?.tokenOut.name,
        customName: poolDetail?.tokenOut.customName,
        customSymbol: poolDetail?.tokenOut.customSymbol,
        imageUri: poolDetail?.tokenOut.imageUri,
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

    const handleSelectPercent = (percent: number) => {
        if (!burnBalanceFormatted || poolDetail?.pool.tokenInDecimals == null)
            return;
        try {
            const balanceBN = new BN(
                parseUnits(burnBalanceFormatted, poolDetail.pool.tokenInDecimals).toString(),
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
        !!burnAmount &&
        Number(burnAmount) > 0 &&
        Number(maxBurnLeft) > 0 &&
        Number(burnAmount) > Number(maxBurnLeft);

    const formattedEstimatedRewardAmount = useMemo(() => {
        if (!burnAmount || !poolDetail) return "0";

        try {
            const {
                tokenInDecimals,
                rewardTokenDecimals,
                rewardNumerator,
                rewardDenominator,
                settlementFee,
            } = poolDetail.pool;

            const amountInBN = new BN(
                parseUnits(burnAmount || "0", tokenInDecimals).toString(),
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
                .div(new BN(10000));

            const finalReward = rewardBN.sub(feeBN);

            const formatted = formatUnits(BigInt(finalReward.toString()), rewardTokenDecimals);
            const num = Number(formatted);
            if (!Number.isFinite(num)) return formatted;
            return num.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 6,
            });
        } catch {
            return "0";
        }
    }, [burnAmount, poolDetail]);

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
            reset();
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
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
                    className="h-fit bg-mb-popover px-8 py-5 sm:max-w-fit"
                >
                    <DialogHeader>
                        <DialogTitle className="text-5xl font-semibold">SWAP</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <SellSection
                            tokenDisplay={burnTokenDisplay}
                            isLoadingWhitelistTokens={!poolDetail}
                            register={register}
                            errors={errors}
                            onSelectPercent={handleSelectPercent}
                            isLoadingBalance={isLoadingBurnBalance}
                            balanceText={`${formatBalanceDisplay(burnBalanceFormatted)} ${burnBalanceSymbol ?? burnTokenDisplay.symbol ?? ""}`}
                            poolDetail={poolDetail}
                            maxBurnLeft={maxBurnLeft}
                            isExceedingMax={isExceedingMax}
                        />

                        <BuySection
                            tokenDisplay={rewardTokenDisplay}
                            isLoadingWhitelistTokens={!poolDetail}
                            estimatedAmount={formattedEstimatedRewardAmount}
                            isLoadingBalance={isLoadingRewardBalance}
                            balanceText={`${formatBalanceDisplay(rewardBalanceFormatted)} ${rewardBalanceSymbol ?? rewardTokenDisplay.symbol ?? ""}`}
                        />

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
                                disabled: isSubmitting || isExceedingMax,
                            }}
                        />

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
