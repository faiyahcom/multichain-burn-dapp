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
import AnimateIconButton from "@/components/common/animate-icon-button";
import { toast } from "@/components/common/custom-toast";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { useSystemStore } from "@/stores/systemStore";
import { useSwapPoolETH } from "./hooks/useSwapPoolETH";
import { useSwapPoolSOL } from "./hooks/useSwapPoolSOL";
import { useMemo, useState } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import { toBaseUnits } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import SellSection from "./sell-section";
import BuySection from "./buy-section";
import FeePanel from "./fee-panel";
import SwapRateRow from "./swap-rate-row";

const swapFormSchema = z.object({
    burnAmount: z
        .string()
        .min(0, { message: "Burn amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Burn amount must be a positive number",
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
    onSuccess: () => void;
};

const SwapDialog = ({ open, onOpenChange, poolDetail, onSuccess }: Props) => {
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

    const { data: whitelistTokens, isLoading: isLoadingWhitelistTokens } = useGetWhitelistTokens();

    const network = poolDetail?.pool.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const burnToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.tokenIn,
    );
    const rewardToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === poolDetail?.pool.rewardToken,
    );

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
            const amountInBN = toBaseUnits(burnAmount, tokenInDecimals);
            if (amountInBN.isZero()) return "0";
            const rewardNumeratorBN = new BN(rewardNumerator);
            const rewardDenominatorBN = new BN(rewardDenominator);
            const decimalDiff = rewardTokenDecimals - tokenInDecimals;
            let rewardBN: BN;
            if (decimalDiff >= 0) {
                const scaleUpBN = new BN(10).pow(new BN(decimalDiff));
                rewardBN = amountInBN.mul(rewardNumeratorBN).mul(scaleUpBN).div(rewardDenominatorBN);
            } else {
                const scaleDownBN = new BN(10).pow(new BN(Math.abs(decimalDiff)));
                rewardBN = amountInBN.mul(rewardNumeratorBN).div(rewardDenominatorBN.mul(scaleDownBN));
            }
            const feeBN = rewardBN.mul(new BN(settlementFee ?? "0")).div(new BN(10000));
            return formatUnits(BigInt(rewardBN.sub(feeBN).toString()), rewardTokenDecimals);
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
                description: error?.message || String(error),
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
                            isLoadingWhitelistTokens={isLoadingWhitelistTokens}
                            register={register}
                            errors={errors}
                            onSelectPercent={handleSelectPercent}
                            isLoadingBalance={isLoadingBurnBalance}
                            balanceText={`${formatBalanceDisplay(burnBalanceFormatted)} ${burnBalanceSymbol ?? burnTokenDisplay.symbol ?? ""}`}
                        />

                        <BuySection
                            tokenDisplay={rewardTokenDisplay}
                            isLoadingWhitelistTokens={isLoadingWhitelistTokens}
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
                                disabled: isSubmitting,
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
