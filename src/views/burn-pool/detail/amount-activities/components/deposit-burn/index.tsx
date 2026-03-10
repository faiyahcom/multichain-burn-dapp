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
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import { formatAmount } from "@/utils/helpers/numbers";
import { Input } from "@/components/ui/input";
import { IconWallet } from "@/assets/react";
import TokenImage from "@/components/common/token-image";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";

const depositFormSchema = z.object({
    amount: z
        .string()
        .min(0, { message: "Amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Amount must be a positive number",
        }),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    onConfirm: (amount: string) => Promise<void>;
};

const SummaryRow = ({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) => (
    <div className="flex items-center justify-between px-6 py-4">
        <div className="text-base text-secondary-text">{label}</div>
        <div>
            {typeof value === "string" ? (
                <span className="font-semibold">{value}</span>
            ) : (
                value
            )}
        </div>
    </div>
);

const DepositBurnDialog = ({
    open,
    onOpenChange,
    poolDetail,
    onConfirm,
}: Props) => {
    const pool = poolDetail?.pool;

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<DepositFormValues>({
        defaultValues: { amount: "" },
        resolver: zodResolver(depositFormSchema),
    });

    const amountStr = watch("amount");

    const { formatted: burnBalanceFormatted, isLoading: isLoadingBurnBalance } =
        useTokenBalance({
            tokenAddress: pool?.tokenIn,
            decimals: pool?.tokenInDecimals,
            symbol: pool?.tokenInSymbol,
        });

    const formattedReward = poolDetail
        ? formatAmount(
            poolDetail.pool.currentRewardAmount,
            poolDetail.pool.rewardTokenDecimals,
        )
        : "-";

    const yourCurrentDepositedAmount = poolDetail?.userAmount.deposited;
    const formattedCurrentDepositedAmount = yourCurrentDepositedAmount
        ? formatAmount(yourCurrentDepositedAmount, poolDetail.pool.tokenInDecimals)
        : "0";

    const handleSelectPercent = (percent: number) => {
        if (!burnBalanceFormatted || pool?.tokenInDecimals == null) return;
        try {
            const balanceBase = parseUnits(
                burnBalanceFormatted,
                pool.tokenInDecimals,
            );
            if (balanceBase === 0n) return;
            const amountBase =
                percent === 100 ? balanceBase : (balanceBase * BigInt(percent)) / 100n;
            const formatted = formatUnits(amountBase, pool.tokenInDecimals);
            setValue("amount", formatted, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const networkConfig = useMemo(
        () => (pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined),
        [pool?.chainId],
    );

    const tokenInDisplay = useMemo(() => {
        if (pool?.assetTypeIn === AssetTypeEnum.NATIVE && networkConfig) {
            const native = networkConfig.appKitNetwork.nativeCurrency;
            return {
                imageUri: networkConfig.iconSrc,
                customSymbol: native.symbol,
                customName: native.name,
            };
        }
        return poolDetail?.tokenIn
            ? {
                imageUri: poolDetail.tokenIn.imageUri,
                customSymbol: poolDetail.tokenIn.customSymbol,
                customName: poolDetail.tokenIn.customName,
            }
            : undefined;
    }, [pool?.assetTypeIn, networkConfig, poolDetail?.tokenIn]);

    const tokenOutDisplay = useMemo(() => {
        if (pool?.assetTypeReward === AssetTypeEnum.NATIVE && networkConfig) {
            const native = networkConfig.appKitNetwork.nativeCurrency;
            return {
                imageUri: networkConfig.iconSrc,
                customSymbol: native.symbol,
                customName: native.name,
            };
        }
        return poolDetail?.tokenOut
            ? {
                imageUri: poolDetail.tokenOut.imageUri,
                customSymbol: poolDetail.tokenOut.customSymbol,
                customName: poolDetail.tokenOut.customName,
            }
            : undefined;
    }, [pool?.assetTypeReward, networkConfig, poolDetail?.tokenOut]);

    const ratio = useMemo(() => {
        if (!pool) return "-";
        const num = Number(pool.rewardNumerator);
        const den = Number(pool.rewardDenominator);
        if (!num || !den) return "Dynamic";
        return `${num}:${den}`;
    }, [pool]);

    const currentBurnFormatted = useMemo(() => {
        if (!poolDetail) return "-";
        const raw =
            Number(poolDetail.depositedAmount) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        return `${raw.toLocaleString(undefined, {
            maximumFractionDigits: poolDetail.pool.tokenInDecimals,
        })} ${tokenInDisplay?.customSymbol ?? poolDetail.pool.tokenInSymbol}`;
    }, [poolDetail, tokenInDisplay]);

    const estmatedReward = useMemo(() => {
        if (!poolDetail) return "-";
        const rewardSymbol =
            tokenOutDisplay?.customSymbol ?? poolDetail.pool.rewardTokenSymbol;
        if (!amountStr) return `0 ${rewardSymbol}`;
        const amount = Number(amountStr);
        if (isNaN(amount) || amount <= 0) return `0 ${rewardSymbol}`;
        const totalDeposited =
            Number(poolDetail.depositedAmount) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        const rewardPool =
            Number(poolDetail.pool.rewardAmount) /
            Math.pow(10, poolDetail.pool.rewardTokenDecimals);
        const yourCurrentDeposited =
            Number(poolDetail.userAmount.deposited) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        const reward =
            ((amount + yourCurrentDeposited) / (totalDeposited + amount)) *
            rewardPool;
        return `${reward} ${rewardSymbol}`;
    }, [poolDetail, tokenOutDisplay, ratio, amountStr]);

    const onSubmit = async (data: DepositFormValues) => {
        await onConfirm(data.amount);
        reset();
    };

    const handleCancel = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogContent
                    showCloseButton={false}
                    className="h-fit w-full bg-primary-foreground px-10 py-6 sm:max-w-4xl"
                >
                    <DialogHeader className="mt-4 text-center">
                        <DialogTitle className="text-3xl font-semibold uppercase">
                            Deposit Token Burn
                        </DialogTitle>
                        <p className="text-[15px] text-secondary-text">
                            Burn token to participate in this pool
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Pool Summary */}
                        <div className="rounded-xl bg-mb-summary-form">
                            {/* <div className="rounded-t-xl bg-inactive px-5 py-3 text-center font-medium">
                                Pool Summary
                            </div> */}
                            <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l-4 [&>*:nth-child(even)]:border-inactive [&>*:nth-child(n+3)]:border-t-4 [&>*:nth-child(n+3)]:border-inactive">
                                <SummaryRow label="Pool Name" value={pool?.name ?? "-"} />
                                <SummaryRow
                                    label="Ratio"
                                    value={<span className="font-semibold">{ratio}</span>}
                                />
                                <SummaryRow
                                    label="Burn Token"
                                    value={
                                        <span className="flex items-center gap-2 font-semibold">
                                            <TokenImage
                                                src={tokenInDisplay?.imageUri}
                                                alt={tokenInDisplay?.customSymbol}
                                                classNames={{
                                                    common: "size-5",
                                                    img: "size-5",
                                                    placeholder: "size-5",
                                                }}
                                            />
                                            {tokenInDisplay?.customSymbol ?? "-"}
                                        </span>
                                    }
                                />
                                <SummaryRow
                                    label="Reward Amount"
                                    value={`${formattedReward}`}
                                />
                                <SummaryRow
                                    label="Reward Token"
                                    value={
                                        <span className="flex items-center gap-2 font-semibold">
                                            <TokenImage
                                                src={tokenOutDisplay?.imageUri}
                                                alt={tokenOutDisplay?.customSymbol}
                                                classNames={{
                                                    common: "size-5",
                                                    img: "size-5",
                                                    placeholder: "size-5",
                                                }}
                                            />
                                            {tokenOutDisplay?.customSymbol ?? "-"}
                                        </span>
                                    }
                                />
                                <SummaryRow label="" value="" />
                            </div>
                        </div>

                        <div className="space-y-9 px-12">
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-medium text-foreground">
                                    Current Burned Amount
                                </span>
                                <span className="text-2xl font-bold text-foreground">
                                    {currentBurnFormatted}
                                </span>
                            </div>
                            {/* Deposit Amount Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>Your Deposited Amount</span>
                                    <span className="flex items-center space-x-2 font-medium text-foreground">
                                        <span>
                                            {formattedCurrentDepositedAmount ?? "0"}{" "}
                                            {tokenInDisplay?.customSymbol ?? ""}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Deposit Amount</span>
                                    <span className="flex items-center space-x-2 text-secondary-text">
                                        <IconWallet />
                                        <span>
                                            {isLoadingBurnBalance
                                                ? "Loading..."
                                                : `${burnBalanceFormatted ?? "0"} ${tokenInDisplay?.customSymbol ?? ""}`}
                                        </span>
                                    </span>
                                </div>

                                <div
                                    className={`relative flex items-center ${errors.amount ? "ring-1 ring-destructive" : ""}`}
                                >
                                    <Input
                                        {...register("amount")}
                                        placeholder="Enter amount"
                                        className="h-full flex-1 px-10 py-2 text-base"
                                    />
                                    <div className="absolute right-0 flex h-full items-center gap-2 rounded-md-plus bg-mb-summary-token-card px-12.5 py-2 text-lg">
                                        <TokenImage
                                            src={tokenInDisplay?.imageUri}
                                            alt={tokenInDisplay?.customSymbol}
                                            classNames={{
                                                common: "size-5",
                                                img: "size-5",
                                                placeholder: "size-5",
                                            }}
                                        />
                                        <span>{tokenInDisplay?.customSymbol ?? ""}</span>
                                    </div>
                                </div>

                                {errors.amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.amount.message}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    {[25, 50, 100].map((percent) => (
                                        <button
                                            type="button"
                                            key={percent}
                                            onClick={() => handleSelectPercent(percent)}
                                            className="rounded-full border border-border px-4 py-1 text-sm font-medium transition hover:border-active hover:bg-active hover:text-white"
                                        >
                                            {percent === 100 ? "Max" : `${percent}%`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-medium text-active">
                                        Estimated Reward:
                                    </span>
                                    <span className="text-2xl font-bold text-active">
                                        {estmatedReward}
                                    </span>
                                </div>
                                <p className="text-[15px] text-secondary-text">
                                    Reward is estimated and not fixed. Final amount will be
                                    determined at claim time.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <AnimateIconButton
                                iconLetter="C"
                                text="Cancel"
                                variant="letter-icon"
                                textVariant="text-container-center"
                                classNames={{
                                    btn: "w-60 text-center after:text-2xl after:text-primary-foreground after:bg-[#FF8E97]",
                                    text: "text-2xl font-medium",
                                    icon: "size-7.5 text-2xl",
                                }}
                                color="#FF8E97"
                                btnProps={{
                                    type: "button",
                                    onClick: handleCancel,
                                    disabled: isSubmitting,
                                }}
                            />
                            <AnimateIconButton
                                iconLetter="D"
                                text="Deposit"
                                variant="letter-icon"
                                textVariant="text-container-center"
                                classNames={{
                                    btn: "w-60 text-center after:text-2xl after:bg-[#966EFF] after:text-primary-foreground border border-active",
                                    text: "text-2xl font-medium",
                                    icon: "size-7.5 text-2xl",
                                }}
                                color="#966EFF"
                                isLoading={isSubmitting}
                                isLoadingText="Depositing..."
                                btnProps={{
                                    type: "submit",
                                }}
                            />
                        </div>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default DepositBurnDialog;
