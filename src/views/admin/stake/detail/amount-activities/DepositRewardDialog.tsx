import { useMemo } from "react";
import { IconWallet } from "@/assets/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import TokenImage from "@/components/common/token-image";
import NetworkIcon from "@/components/layout/header/network-icon";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { chainIdToNetworkConfig, type NetworkId } from "@/config/networks";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import {
    toBaseUnits,
    shortenNumber,
    safeDecimalParse,
    safeDecimal,
} from "@/utils/helpers/numbers";
import Decimal from "decimal.js";
import { AssetTypeEnum } from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import BN from "bn.js";
import { formatUnits } from "viem";

// ─── Duration helper ─────────────────────────────────────────────────────────

function formatDuration(seconds: number | undefined | null): string {
    if (
        seconds === undefined ||
        seconds === null ||
        !isFinite(seconds) ||
        seconds < 0
    )
        return "—";
    if (seconds === 0) return "0";
    if (seconds >= 9_007_199_254_740_991) return "Infinite";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    return parts.length ? parts.join(" ") : `${seconds}s`;
}

// ─── Summary row ─────────────────────────────────────────────────────────────

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

// ─── Form schema ──────────────────────────────────────────────────────────────

const createSchema = ({ maxAmount }: { maxAmount: string | undefined }) =>
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
                    if (!maxAmount || isNaN(Number(maxAmount))) return true;
                    return Number(v) <= Number(maxAmount);
                },
                { error: `Amount must not exceed ${maxAmount}` },
            ),
    });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poolDetail?: PoolDetailResponse;
    onConfirm: (amount: string) => Promise<void>;
};

// ─── Component ───────────────────────────────────────────────────────────────

const DepositRewardDialog = ({
    open,
    onOpenChange,
    poolDetail,
    onConfirm,
}: Props) => {
    const pool = poolDetail?.pool;
    const stakePool = pool;

    const {
        formatted: rewardBalanceFormatted,
        isLoading: isLoadingRewardBalance,
        refetch: refetchRewardBalance,
    } = useTokenBalance({
        tokenAddress: pool?.rewardToken,
        decimals: pool?.rewardTokenDecimals,
        symbol: pool?.rewardTokenSymbol,
    });

    const schema = useMemo(
        () => createSchema({ maxAmount: rewardBalanceFormatted }),
        [rewardBalanceFormatted],
    );

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormValues>({
        defaultValues: { amount: "" },
        resolver: zodResolver(schema),
    });

    const amountStr = watch("amount");

    const network = pool?.chainId
        ? chainIdToNetworkConfig(pool.chainId)
        : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const isNativeReward = pool?.assetTypeReward === AssetTypeEnum.NATIVE;
    const rewardSymbol = isNativeReward
        ? (network?.appKitNetwork.nativeCurrency.symbol ??
            pool?.rewardTokenSymbol ??
            "")
        : rewardTokenDisplay.symbol;

    const aprDisplay =
        stakePool?.apr !== undefined
            ? `${(Number(stakePool.apr) / 100).toFixed(2)}%`
            : "—";

    const currentRewardFormatted = useMemo(() => {
        if (!pool) return "-";
        const raw = shortenNumber({
            number: safeDecimal(pool.currentRewardAmount)
                .div(new Decimal(10).pow(pool.rewardTokenDecimals ?? 0))
                .toNumber(),
        });
        return `${raw} ${rewardSymbol}`;
    }, [pool, rewardSymbol]);

    const insufficientBalance = useMemo(() => {
        if (!amountStr || !rewardBalanceFormatted || isLoadingRewardBalance)
            return undefined;
        const a = safeDecimalParse({ value: amountStr });
        const b = safeDecimalParse({ value: rewardBalanceFormatted });
        if (!a || !b) return undefined;
        if (a.lte(0) || a.lte(b)) return undefined;
        return `Amount exceeds wallet balance (${rewardBalanceFormatted} ${rewardSymbol})`;
    }, [amountStr, rewardBalanceFormatted, isLoadingRewardBalance, rewardSymbol]);

    const handleSelectPercent = (percent: number) => {
        if (!rewardBalanceFormatted || pool?.rewardTokenDecimals == null) return;
        try {
            const balBN = new BN(
                toBaseUnits(rewardBalanceFormatted, pool.rewardTokenDecimals),
            );
            if (balBN.isZero()) return;
            const amtBN = percent === 100 ? balBN : balBN.muln(percent).divn(100);
            const formatted = formatUnits(
                BigInt(amtBN.toString()),
                pool.rewardTokenDecimals,
            );
            const [int, dec] = formatted.split(".");
            setValue("amount", dec ? `${int}.${dec.slice(0, 6)}` : int, {
                shouldValidate: true,
            });
        } catch {
            /* ignore */
        }
    };

    const onSubmit = async (data: FormValues) => {
        await onConfirm(data.amount);
        refetchRewardBalance();
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
                            Deposit Reward
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Pool Summary */}
                        <div className="rounded-xl bg-mb-summary-form">
                            <div className="rounded-t-xl bg-inactive px-5 py-3 text-center font-medium">
                                Pool Summary
                            </div>
                            <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l-4 [&>*:nth-child(even)]:border-inactive [&>*:nth-child(n+3)]:border-t-4 [&>*:nth-child(n+3)]:border-inactive">
                                <SummaryRow
                                    label="Pool Name"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-28" />
                                        ) : (
                                            (pool.name ?? "—")
                                        )
                                    }
                                />
                                <SummaryRow
                                    label="Interest Accrual Duration:"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : !stakePool?.interestAccrualDuration ||
                                            stakePool?.interestAccrualDuration === "0" ? (
                                            "Unlimited"
                                        ) : (
                                            formatDuration(Number(stakePool?.interestAccrualDuration))
                                        )
                                    }
                                />
                                <SummaryRow label="Pool Type:" value="Staking Pool" />
                                <SummaryRow
                                    label="Claim Start Delay:"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            formatDuration(Number(stakePool?.claimStartDelay))
                                        )
                                    }
                                />
                                <SummaryRow
                                    label="APR:"
                                    value={!pool ? <Skeleton className="h-5 w-16" /> : aprDisplay}
                                />
                                <SummaryRow
                                    label="Network"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            <span className="flex items-center gap-2 font-semibold">
                                                <NetworkIcon
                                                    networkId={network?.id || ("" as NetworkId)}
                                                    className="size-5"
                                                />
                                                {network?.label ?? "—"}
                                            </span>
                                        )
                                    }
                                />
                                <SummaryRow
                                    label="Lock-up Duration:"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            formatDuration(Number(stakePool?.lockUpDuration))
                                        )
                                    }
                                />
                                <SummaryRow
                                    label="Staking Token:"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-28" />
                                        ) : (
                                            <span className="flex items-center gap-2 font-semibold">
                                                <TokenImage
                                                    src={stakingTokenDisplay.imageUri}
                                                    alt={stakingTokenDisplay.symbol}
                                                    classNames={{
                                                        common: "size-5",
                                                        img: "size-5",
                                                        placeholder: "size-5",
                                                    }}
                                                />
                                                {stakingTokenDisplay.symbol}
                                            </span>
                                        )
                                    }
                                />
                                <SummaryRow
                                    label="Interest Start Delay:"
                                    value={
                                        !pool ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            // API field has a typo: "interestStrartDelay"
                                            formatDuration(Number(stakePool?.interestStartDelay))
                                        )
                                    }
                                />
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
                                                    classNames={{
                                                        common: "size-5",
                                                        img: "size-5",
                                                        placeholder: "size-5",
                                                    }}
                                                />
                                                {rewardSymbol}
                                            </span>
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-9 px-12">
                            {/* Current Reward Deposited */}
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-medium text-active">
                                    Current Reward Deposited
                                </span>
                                <span className="text-2xl font-bold text-active">
                                    {!pool ? (
                                        <Skeleton className="h-8 w-36" />
                                    ) : (
                                        currentRewardFormatted
                                    )}
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
                                                : `${rewardBalanceFormatted ?? "0"} ${rewardSymbol}`}
                                        </span>
                                    </span>
                                </div>

                                <div
                                    className={`relative flex items-center ${errors.amount ? "ring-1 ring-destructive" : ""
                                        }`}
                                >
                                    <Input
                                        {...register("amount")}
                                        type="number"
                                        step={DEFAULT_INPUT_NUMBER_STEP}
                                        placeholder="Enter amount"
                                        className="h-full flex-1 px-10 py-2 text-base"
                                    />
                                    <div className="absolute right-0 flex h-full items-center gap-2 rounded-md-plus bg-mb-summary-token-card px-12.5 py-2 text-lg">
                                        <TokenImage
                                            src={rewardTokenDisplay.imageUri}
                                            alt={rewardTokenDisplay.symbol}
                                            classNames={{
                                                common: "size-5",
                                                img: "size-5",
                                                placeholder: "size-5",
                                            }}
                                        />
                                        <span>{rewardSymbol}</span>
                                    </div>
                                </div>

                                {errors.amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.amount.message}
                                    </p>
                                )}
                                {insufficientBalance && (
                                    <p className="text-xs text-destructive">
                                        {insufficientBalance}
                                    </p>
                                )}

                                <div className="flex gap-2">
                                    {[25, 50, 75, 100].map((p) => (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => handleSelectPercent(p)}
                                            className="rounded-full border border-border px-4 py-1 text-sm font-medium transition hover:border-active hover:bg-active hover:text-white"
                                        >
                                            {p === 100 ? "Max" : `${p}%`}
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
                                    disabled: !isValid || !!insufficientBalance,
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
