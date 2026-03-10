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
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import { toBaseUnits } from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import { Input } from "@/components/ui/input";
import { IconWallet } from "@/assets/react";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";

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

const DepositRewardDialog = ({
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
        formState: { errors, isSubmitting },
    } = useForm<DepositFormValues>({
        defaultValues: { amount: "" },
        resolver: zodResolver(depositFormSchema),
    });

    const { data: whitelistTokens, isLoading: isLoadingWhitelistTokens } = useGetWhitelistTokens();

    const rewardToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === pool?.rewardToken,
    );
    const burnToken = whitelistTokens?.whitelistTokens?.find(
        (token) => token.address === pool?.tokenIn,
    );

    const {
        formatted: rewardBalanceFormatted,
        isLoading: isLoadingRewardBalance,
    } = useTokenBalance({
        tokenAddress: pool?.rewardToken,
        decimals: pool?.rewardTokenDecimals,
        symbol: pool?.rewardTokenSymbol,
    });

    const networkConfig = useMemo(
        () => (pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined),
        [pool?.chainId],
    );

    const tokenInDisplay = useMemo(() => {
        if (pool?.assetTypeIn === AssetTypeEnum.NATIVE && networkConfig) {
            const native = networkConfig.appKitNetwork.nativeCurrency;
            return {
                imageUri: networkConfig.iconSrc,
                symbol: native.symbol,
                name: native.name,
            };
        }
        return burnToken
            ? { imageUri: burnToken.imageUri, symbol: burnToken.symbol, name: burnToken.name }
            : undefined;
    }, [pool?.assetTypeIn, networkConfig, burnToken]);

    const tokenOutDisplay = useMemo(() => {
        if (pool?.assetTypeReward === AssetTypeEnum.NATIVE && networkConfig) {
            const native = networkConfig.appKitNetwork.nativeCurrency;
            return {
                imageUri: networkConfig.iconSrc,
                symbol: native.symbol,
                name: native.name,
            };
        }
        return rewardToken
            ? { imageUri: rewardToken.imageUri, symbol: rewardToken.symbol, name: rewardToken.name }
            : undefined;
    }, [pool?.assetTypeReward, networkConfig, rewardToken]);

    const isNativeIn = pool?.assetTypeIn === AssetTypeEnum.NATIVE;
    const isNativeOut = pool?.assetTypeReward === AssetTypeEnum.NATIVE;
    const isLoadingTokenIn = !isNativeIn && isLoadingWhitelistTokens;
    const isLoadingTokenOut = !isNativeOut && isLoadingWhitelistTokens;

    const handleSelectPercent = (percent: number) => {
        if (!rewardBalanceFormatted || pool?.rewardTokenDecimals == null) return;
        try {
            const balanceBN = new BN(
                toBaseUnits(rewardBalanceFormatted, pool.rewardTokenDecimals),
            );
            if (balanceBN.isZero()) return;
            const amountBN =
                percent === 100 ? balanceBN : balanceBN.muln(percent).divn(100);
            const formatted = formatUnits(
                BigInt(amountBN.toString()),
                pool.rewardTokenDecimals,
            );
            setValue("amount", formatted, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const currentRewardFormatted = useMemo(() => {
        if (!pool) return "-";
        const raw =
            Number(pool.currentRewardAmount) / Math.pow(10, pool.rewardTokenDecimals);
        return `${raw.toLocaleString(undefined, {
            maximumFractionDigits: pool.rewardTokenDecimals,
        })} ${tokenOutDisplay?.symbol ?? pool.rewardTokenSymbol}`;
    }, [pool, tokenOutDisplay]);

    const duration = useMemo(() => {
        if (!pool) return "-";
        const start = formatTimestampSecondsToDate({
            timestamp: pool.timeStart,
            formatStr: "MM/dd/yyyy",
        });
        const end = formatTimestampSecondsToDate({
            timestamp: pool.timeEnd,
            formatStr: "MM/dd/yyyy",
        });
        return `${start} → ${end}`;
    }, [pool]);

    const ratio = useMemo(() => {
        if (!pool) return "-";
        const num = Number(pool.rewardNumerator);
        const den = Number(pool.rewardDenominator);
        if (!num || !den) return "Dynamic";
        return `${num}:${den}`;
    }, [pool]);

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
                            Deposit Reward Token
                        </DialogTitle>
                        <p className="text-[15px] text-secondary-text">
                            Fund reward tokens for this burn pool
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Pool Summary */}
                        <div className="rounded-xl bg-mb-summary-form">
                            <div className="rounded-t-xl bg-inactive px-5 py-3 text-center font-medium">
                                Pool Summary
                            </div>
                            <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l-4 [&>*:nth-child(even)]:border-inactive [&>*:nth-child(n+3)]:border-t-4 [&>*:nth-child(n+3)]:border-inactive">
                                <SummaryRow label="Pool Name" value={!pool ? <Skeleton className="h-5 w-28" /> : pool.name} />
                                <SummaryRow label="Duration" value={!pool ? <Skeleton className="h-5 w-36" /> : duration} />
                                <SummaryRow
                                    label="Reward Token"
                                    value={
                                        (!pool || isLoadingTokenOut) ? <Skeleton className="h-5 w-28" /> :
                                        <span className="flex items-center gap-2 font-semibold">
                                            <TokenImage
                                                src={tokenOutDisplay?.imageUri}
                                                alt={tokenOutDisplay?.symbol}
                                                classNames={{
                                                    common: "size-5",
                                                    img: "size-5",
                                                    placeholder: "size-5",
                                                }}
                                            />
                                            {tokenOutDisplay?.symbol ?? pool.rewardTokenSymbol ?? "-"}
                                        </span>
                                    }
                                />
                                <SummaryRow
                                    label="Burn token"
                                    value={
                                        (!pool || isLoadingTokenIn) ? <Skeleton className="h-5 w-28" /> :
                                        <span className="flex items-center gap-2 font-semibold">
                                            <TokenImage
                                                src={tokenInDisplay?.imageUri}
                                                alt={tokenInDisplay?.symbol}
                                                classNames={{
                                                    common: "size-5",
                                                    img: "size-5",
                                                    placeholder: "size-5",
                                                }}
                                            />
                                            {tokenInDisplay?.symbol ?? pool.tokenInSymbol ?? "-"}
                                        </span>
                                    }
                                />
                                <SummaryRow
                                    label="Ratio"
                                    value={!pool ? <Skeleton className="h-5 w-16" /> : <span className="font-semibold">{ratio}</span>}
                                />
                                <SummaryRow
                                    label="Network"
                                    value={
                                        !pool ? <Skeleton className="h-5 w-24" /> :
                                        <span className="flex items-center gap-2 font-semibold">
                                            <TokenImage
                                                src={networkConfig?.iconSrc}
                                                alt={networkConfig?.label}
                                                classNames={{
                                                    common: "size-5",
                                                    img: "size-5",
                                                    placeholder: "size-5",
                                                }}
                                            />
                                            {networkConfig?.label ?? "-"}
                                        </span>
                                    }
                                />
                                <div className="col-span-2">
                                    <SummaryRow
                                        label="Burn Method"
                                        value={
                                            <span className="font-semibold text-active">Burn</span>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-9 px-12">
                            {/* Current Reward Amount */}
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-medium text-active">
                                    Current Reward Amount
                                </span>
                                <span className="text-2xl font-bold text-active">
                                    {!pool ? <Skeleton className="h-8 w-36" /> : currentRewardFormatted}
                                </span>
                            </div>

                            {/* Deposit Amount Input */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>Deposit Amount</span>
                                    <span className="flex items-center space-x-2 text-secondary-text">
                                        <IconWallet />
                                        <span>
                                            {isLoadingRewardBalance
                                                ? "Loading..."
                                                : `${rewardBalanceFormatted ?? "0"} ${tokenOutDisplay?.symbol ?? ""}`}
                                        </span>
                                    </span>
                                </div>

                                <div
                                    className={`relative flex items-center ${errors.amount ? "ring-1 ring-destructive" : ""
                                        }`}
                                >
                                    <Input
                                        {...register("amount")}
                                        placeholder="Enter amount"
                                        className="h-full flex-1 px-10 py-2 text-base"
                                    />
                                    <div className="absolute right-0 flex h-full items-center gap-2 rounded-md-plus bg-mb-summary-token-card px-12.5 py-2 text-lg">
                                        {(!pool || isLoadingTokenOut) ? (
                                            <>
                                                <Skeleton className="size-5 rounded-full" />
                                                <Skeleton className="h-5 w-12" />
                                            </>
                                        ) : (
                                            <>
                                                <TokenImage
                                                    src={tokenOutDisplay?.imageUri}
                                                    alt={tokenOutDisplay?.symbol}
                                                    classNames={{
                                                        common: "size-5",
                                                        img: "size-5",
                                                        placeholder: "size-5",
                                                    }}
                                                />
                                                <span className="">{tokenOutDisplay?.symbol ?? pool.rewardTokenSymbol ?? ""}</span>
                                            </>
                                        )}
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
                                    disabled: isSubmitting,
                                }}
                            />
                        </div>
                    </form>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
};

export default DepositRewardDialog;
