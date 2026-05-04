import { IconWallet } from "@/assets/react";
import TokenImage from "@/components/common/token-image";
import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
    getVariantBgClassName,
    getVariantBorderClassName,
    getVariantShadowClassName,
} from "@/components/common/glow/container";
import { Input } from "@/components/common/glow/input";
import { Button } from "@/components/common/glow/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import type { PoolDetailResponse } from "@/types/pool";
import {
    formatAmount,
    safeDecimalParse,
    safeBigInt,
    shortenNumber,
} from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import z from "zod";
import { formatDuration } from "@/utils/helpers/timer";

const createStakeFormSchema = ({
    decimals,
    rawBalance,
    minRaw,
    maxRaw,
    remainingRaw,
    minFormatted,
    maxFormatted,
    remainingFormatted,
    balanceFormatted,
    symbol,
}: {
    decimals: number;
    rawBalance: bigint | undefined;
    minRaw: bigint | null;
    maxRaw: bigint | null;
    remainingRaw: bigint | null;
    minFormatted: string | undefined;
    maxFormatted: string | undefined;
    remainingFormatted: string | undefined;
    balanceFormatted: string | undefined;
    symbol: string;
}) =>
    z.object({
        amount: z
            .string()
            .min(1, { error: "Amount is required" })
            .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
                error: "Amount must be a positive number",
            })
            .refine(
                (v) => {
                    const d = safeDecimalParse({ value: v });
                    return d && d.decimalPlaces() <= 6;
                },
                { error: "Amount must have 6 decimals or less" },
            )
            .refine(
                (v) => {
                    if (rawBalance === undefined) return true;
                    try {
                        return parseUnits(v, decimals) <= rawBalance;
                    } catch {
                        return false;
                    }
                },
                {
                    error: `Amount exceeds wallet balance (${balanceFormatted} ${symbol})`,
                },
            )
            .refine(
                (v) => {
                    if (minRaw === null) return true;
                    try {
                        return parseUnits(v, decimals) >= minRaw;
                    } catch {
                        return false;
                    }
                },
                {
                    error: `Amount is below minimum staking amount (${minFormatted} ${symbol})`,
                },
            )
            .refine(
                (v) => {
                    if (maxRaw === null) return true;
                    try {
                        return parseUnits(v, decimals) <= maxRaw;
                    } catch {
                        return false;
                    }
                },
                {
                    error: `Amount exceeds maximum staking amount (${maxFormatted} ${symbol})`,
                },
            )
            .refine(
                (v) => {
                    if (remainingRaw === null) return true;
                    try {
                        return parseUnits(v, decimals) <= remainingRaw;
                    } catch {
                        return false;
                    }
                },
                {
                    error: `Amount exceeds remaining pool capacity (${remainingFormatted} ${symbol})`,
                },
            ),
    });

type StakeFormValues = z.infer<ReturnType<typeof createStakeFormSchema>>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    onConfirm: (amount: string) => Promise<void>;
};

const SummaryRow = ({
    label,
    value,
    className,
}: {
    label: string;
    value: React.ReactNode;
    className?: string;
}) => (
    <div
        className={cn(
            "flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 2xl:px-6 2xl:py-4",
            className,
        )}
    >
        <div className="text-sm font-medium text-nowrap text-mb-gray-b8 sm:text-base 2xl:text-xl">
            {label}
        </div>
        <div className="text-sm sm:text-base 2xl:text-xl">
            {typeof value === "string" ? (
                <span className="font-semibold">{value}</span>
            ) : (
                value
            )}
        </div>
    </div>
);

const StakeDialog = ({ open, onOpenChange, poolDetail, onConfirm }: Props) => {
    const pool = poolDetail?.pool;
    const isSameToken = !!(
        pool?.rewardToken &&
        pool?.tokenIn &&
        pool.rewardToken.toLowerCase() === pool.tokenIn.toLowerCase()
    );
    const network = poolDetail?.pool?.chainId
        ? chainIdToNetworkConfig(poolDetail.pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const {
        formatted: stakingBalanceFormatted,
        balance: stakingBalanceRaw,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useTokenBalance({
        tokenAddress: pool?.tokenIn,
        decimals: pool?.tokenInDecimals,
        symbol: pool?.tokenInSymbol,
    });

    const stakingLimits = useMemo(() => {
        const decimals = pool?.tokenInDecimals;
        const empty = {
            min: null,
            max: null,
            remaining: null,
            minFormatted: undefined,
            maxFormatted: undefined,
            remainingFormatted: undefined,
        } as const;
        if (decimals == null) return empty;
        let min: bigint | null = null;
        let max: bigint | null = null;
        let remaining: bigint | null = null;
        try {
            if (pool?.minStakingAmount && pool.minStakingAmount !== "0")
                min = safeBigInt(pool.minStakingAmount);
        } catch {
            /* ignore */
        }
        try {
            if (pool?.maxStakingAmount && pool.maxStakingAmount !== "0")
                max = safeBigInt(pool.maxStakingAmount);
        } catch {
            /* ignore */
        }
        if (pool?.stakingLimit && pool.stakingLimit !== "0") {
            try {
                const limit = safeBigInt(pool.stakingLimit);
                const staked = safeBigInt(poolDetail?.staking?.totalStaked);
                const r = limit - staked;
                remaining = r >= 0n ? r : 0n;
            } catch {
                /* ignore */
            }
        }
        const fmt = (raw: bigint | null) =>
            raw !== null ? formatAmount(raw.toString(), decimals) : undefined;
        return {
            min,
            max,
            remaining,
            minFormatted: fmt(min),
            maxFormatted: fmt(max),
            remainingFormatted: fmt(remaining),
        };
    }, [
        pool?.minStakingAmount,
        pool?.maxStakingAmount,
        pool?.stakingLimit,
        poolDetail?.staking?.totalStaked,
        pool?.tokenInDecimals,
    ]);

    const stakeFormSchema = useMemo(
        () =>
            createStakeFormSchema({
                decimals: pool?.tokenInDecimals ?? 0,
                rawBalance: stakingBalanceRaw,
                minRaw: stakingLimits.min,
                maxRaw: stakingLimits.max,
                remainingRaw: stakingLimits.remaining,
                minFormatted: stakingLimits.minFormatted,
                maxFormatted: stakingLimits.maxFormatted,
                remainingFormatted: stakingLimits.remainingFormatted,
                balanceFormatted: stakingBalanceFormatted,
                symbol: stakingTokenDisplay.symbol,
            }),
        [
            stakingBalanceRaw,
            stakingBalanceFormatted,
            stakingLimits,
            stakingTokenDisplay.symbol,
            pool?.tokenInDecimals,
        ],
    );

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<StakeFormValues>({
        defaultValues: { amount: "" },
        resolver: zodResolver(stakeFormSchema),
        mode: "onChange",
    });

    const yourTotalStaked = poolDetail?.staking?.user?.totalStaked
        ? formatAmount(
            poolDetail.staking.user.totalStaked,
            poolDetail.pool.tokenInDecimals,
        )
        : "0";

    const fmtStakingAmt = (raw: string | null | undefined) => {
        if (!raw || raw === "0" || pool?.tokenInDecimals == null)
            return "Unlimited";
        return `${formatAmount(raw, pool.tokenInDecimals)} ${stakingTokenDisplay.symbol}`;
    };

    const handleSelectPercent = (percent: number) => {
        if (!stakingBalanceFormatted || pool?.tokenInDecimals == null) return;
        try {
            const balanceBase = parseUnits(
                stakingBalanceFormatted,
                pool.tokenInDecimals,
            );
            if (balanceBase === 0n) return;
            let amountBase =
                percent === 100 ? balanceBase : (balanceBase * BigInt(percent)) / 100n;
            // Cap at pool's max staking amount
            // if (stakingLimits.max !== null && amountBase > stakingLimits.max) {
            //     amountBase = stakingLimits.max;
            // }
            // // Cap at remaining pool capacity
            // if (
            //     stakingLimits.remaining !== null &&
            //     amountBase > stakingLimits.remaining
            // ) {
            //     amountBase = stakingLimits.remaining;
            // }
            const formatted = formatUnits(amountBase, pool.tokenInDecimals);
            const [integer, decimal] = formatted.split(".");
            const trimmed = decimal ? `${integer}.${decimal.slice(0, 6)}` : integer;
            setValue("amount", trimmed, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const onSubmit = async (data: StakeFormValues) => {
        await onConfirm(data.amount);
        refetchBalance();
        reset();
    };

    const handleCancel = () => {
        reset();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                <DialogOverlay />
                <DialogBody
                    showCloseButton={false}
                    className="fixed inset-0 z-50 overflow-y-auto"
                >
                    <div
                        className="flex min-h-full flex-col items-center justify-center p-2 sm:p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) onOpenChange(false);
                        }}
                    >
                        <div
                            className={cn(
                                "h-fit w-full bg-background sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-6xl",
                                getVariantBorderClassName({
                                    variant: "stake",
                                    custom: "rounded-xl",
                                }),
                                getVariantShadowClassName({ variant: "stake" }),
                            )}
                        >
                            <div
                                className={cn(
                                    "h-fit w-full rounded-xl px-3 py-4 sm:px-6 2xl:py-8",
                                    getVariantBgClassName({ variant: "stake" }),
                                )}
                            >
                                <DialogHeader className="mb-4 text-center">
                                    <DialogTitle className="mb-2 font-orbitron text-2xl font-semibold uppercase sm:text-3xl xl:text-4xl 2xl:mb-4">
                                        Stake Token
                                    </DialogTitle>
                                    <p className="font-inter text-sm text-mb-gray-b8 sm:text-base 2xl:text-xl">
                                        Stake tokens to earn rewards from this pool
                                    </p>
                                </DialogHeader>

                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="flex flex-col gap-2 font-inter 2xl:gap-6"
                                >
                                    {/* Pool Summary */}
                                    <div
                                        className={cn(
                                            "rounded-xl",
                                            getVariantShadowClassName({ variant: "stake" }),
                                            getVariantBorderClassName({ variant: "stake" }),
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "rounded-t-xl px-5 py-3 text-center font-orbitron font-semibold sm:text-lg 2xl:text-2xl",
                                                getVariantBgClassName({ variant: "stake" }),
                                            )}
                                        >
                                            Pool Summary
                                        </div>
                                        <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-stake-border [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-stake-border">
                                            <SummaryRow
                                                label="Pool Name"
                                                value={
                                                    !pool ? <Skeleton className="h-5 w-28" /> : pool.name
                                                }
                                            />
                                            <SummaryRow
                                                label="Lock-up Duration"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-20" />
                                                    ) : (
                                                        formatDuration(pool.lockUpDuration)
                                                    )
                                                }
                                            />
                                            <SummaryRow label="Pool Type" value="Staking Pool" />
                                            <SummaryRow
                                                label="Interest Start Delay"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-20" />
                                                    ) : (
                                                        formatDuration(pool?.interestStartDelay)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Min Staking Amount"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-24" />
                                                    ) : (
                                                        fmtStakingAmt(pool.minStakingAmount)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Interest Accrual Duration"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-20" />
                                                    ) : !pool.interestAccrualDuration ||
                                                        pool.interestAccrualDuration === "0" ? (
                                                        "Unlimited"
                                                    ) : (
                                                        formatDuration(pool.interestAccrualDuration)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Max Staking Amount"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-24" />
                                                    ) : (
                                                        fmtStakingAmt(pool.maxStakingAmount)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Claim Start Delay"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-20" />
                                                    ) : (
                                                        formatDuration(pool.claimStartDelay)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Pool Limit"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-24" />
                                                    ) : (
                                                        fmtStakingAmt(pool.stakingLimit)
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Network"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-24" />
                                                    ) : (
                                                        <span className="flex items-center gap-2 font-semibold">
                                                            <TokenImage
                                                                src={network?.iconSrc}
                                                                alt={network?.label ?? ""}
                                                                classNames={{ common: "size-4 sm:size-5" }}
                                                            />
                                                            {network?.label ?? "—"}
                                                        </span>
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Remaining Capacity"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-24" />
                                                    ) : !pool.stakingLimit ||
                                                        pool.stakingLimit === "0" ? (
                                                        "Unlimited"
                                                    ) : stakingLimits.remainingFormatted != null ? (
                                                        `${stakingLimits.remainingFormatted} ${stakingTokenDisplay.symbol}`
                                                    ) : (
                                                        "—"
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="Staking Token"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-28" />
                                                    ) : (
                                                        <span className="flex items-center gap-2 font-semibold">
                                                            <TokenImage
                                                                src={stakingTokenDisplay.imageUri}
                                                                alt={stakingTokenDisplay.symbol}
                                                                classNames={{ common: "size-4 sm:size-5" }}
                                                            />
                                                            {stakingTokenDisplay.symbol}
                                                        </span>
                                                    )
                                                }
                                            />
                                            <SummaryRow
                                                label="APR"
                                                value={
                                                    !pool ? (
                                                        <Skeleton className="h-5 w-16" />
                                                    ) : pool.apr ? (
                                                        `${shortenNumber({ number: Number(pool.apr) / 100, decimalPlaces: 2 })}%`
                                                    ) : (
                                                        "—"
                                                    )
                                                }
                                            />
                                            {isSameToken ? (
                                                <SummaryRow
                                                    label="Interest generated by the APR"
                                                    value={
                                                        <span className="text-mb-gray-b8">
                                                            {/* Interest generated by the APR */}
                                                        </span>
                                                    }
                                                />
                                            ) : (
                                                <SummaryRow
                                                    label="Reward Token"
                                                    value={
                                                        !pool ? (
                                                            <Skeleton className="h-5 w-28" />
                                                        ) : (
                                                            <span className="flex items-center gap-2 font-semibold">
                                                                <TokenImage
                                                                    src={rewardTokenDisplay.imageUri}
                                                                    alt={rewardTokenDisplay.symbol}
                                                                    classNames={{ common: "size-4 sm:size-5" }}
                                                                />
                                                                {rewardTokenDisplay.symbol}
                                                            </span>
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 2xl:space-y-6">
                                        {/* Your Total Staked */}
                                        <div className="flex items-center justify-between text-mb-btn-stake">
                                            <span className="font-inter text-base font-medium sm:text-xl 2xl:text-2xl">
                                                Your Total Staked
                                            </span>
                                            <span className="font-inter text-base font-bold text-nowrap sm:text-xl 2xl:text-2xl">
                                                {yourTotalStaked} {stakingTokenDisplay.symbol}
                                            </span>
                                        </div>

                                        {/* Amount Input */}
                                        <div className="space-y-2 2xl:space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="font-inter text-sm font-medium sm:text-base 2xl:text-xl">
                                                    Stake Amount
                                                </label>
                                                <span className="flex items-center gap-2 font-inter text-sm text-nowrap sm:text-base 2xl:text-xl">
                                                    <IconWallet className="text-mb-gray-b8" />
                                                    {isLoadingBalance ? (
                                                        <Skeleton className="h-4 w-20" />
                                                    ) : (
                                                        `${stakingBalanceFormatted ?? "0"} ${stakingTokenDisplay.symbol}`
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex gap-3">
                                                <Input
                                                    variant="stake"
                                                    type="number"
                                                    step={DEFAULT_INPUT_NUMBER_STEP}
                                                    min={0}
                                                    placeholder="0.0"
                                                    className="w-full border-2 bg-transparent"
                                                    {...register("amount")}
                                                />
                                                <div
                                                    className={cn(
                                                        "flex items-center gap-2 rounded-md bg-mb-dark-popover px-2 text-mb-btn-stake sm:px-4",
                                                        getVariantBorderClassName({ variant: "stake" }),
                                                    )}
                                                >
                                                    <TokenImage
                                                        src={stakingTokenDisplay.imageUri}
                                                        alt={stakingTokenDisplay.symbol}
                                                        classNames={{
                                                            common: "size-5",
                                                            img: "size-5",
                                                            placeholder: "size-5",
                                                        }}
                                                    />
                                                    <span className="font-inter text-sm font-medium sm:text-base">
                                                        {stakingTokenDisplay.symbol}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Percentage chips */}
                                            <div className="flex flex-wrap gap-2">
                                                {[25, 50, 75, 100].map((pct) => (
                                                    <button
                                                        key={pct}
                                                        type="button"
                                                        onClick={() => handleSelectPercent(pct)}
                                                        className={cn(
                                                            "rounded-full bg-mb-dark-popover px-2.5 py-1 font-inter text-sm font-medium text-mb-btn-stake transition hover:bg-mb-btn-stake hover:text-white",
                                                            getVariantBorderClassName({ variant: "stake" }),
                                                        )}
                                                    >
                                                        {pct === 100 ? "Max" : `${pct}%`}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.amount && (
                                                <p className="font-inter text-xs text-destructive">
                                                    {errors.amount.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4 pt-2">
                                        <Button
                                            type="button"
                                            variant="stake"
                                            onClick={handleCancel}
                                            disabled={isSubmitting}
                                            hasHover
                                            className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="stake"
                                            hasHover
                                            isLoading={isSubmitting}
                                            className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                                        >
                                            Stake
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </DialogBody>
            </DialogPortal>
        </Dialog>
    );
};

export default StakeDialog;
