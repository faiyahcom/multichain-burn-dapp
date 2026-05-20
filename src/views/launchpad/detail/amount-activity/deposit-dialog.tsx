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
import { NumericInput } from "@/components/ui/numeric-input";
import { Button } from "@/components/common/glow/button";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import type { PoolDetailResponse } from "@/types/pool";
import {
    formatAmount,
    safeDecimal,
    safeDecimalParse,
    shortenNumber,
} from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import z from "zod";
import NetworkDisplay from "@/components/common/network-display";
import Decimal from "decimal.js";
import { DECIMAL_FEE_PERCENT } from "@/views/admin/fee-settings-management/hooks/useFeeSettings";
import TBDTooltip from "@/views/pool/glow/components/launchpad/tbd-tooltip";

const createDepositFormSchema = ({
    decimals,
    rawBalance,
    balanceFormatted,
    symbol,
    hardcapHuman,
}: {
    decimals: number;
    rawBalance: bigint | undefined;
    balanceFormatted: string | undefined;
    symbol: string;
    hardcapHuman?: string;
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
                    if (!hardcapHuman) return true;
                    const dHardcap = safeDecimalParse({ value: hardcapHuman });
                    const dAmount = safeDecimalParse({ value: v });
                    if (!dHardcap || !dAmount) return true;
                    return dAmount.lte(dHardcap);
                },
                { error: "Amount exceeds pool capacity" },
            ),
    });

type DepositFormValues = z.infer<ReturnType<typeof createDepositFormSchema>>;

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

const DepositDialog = ({
    open,
    onOpenChange,
    poolDetail,
    onConfirm,
}: Props) => {
    const pool = poolDetail?.pool;
    const network = pool?.chainId
        ? chainIdToNetworkConfig(pool.chainId)
        : undefined;

    const saleTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const paymentTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });

    const isDynamic =
        !pool?.rewardDenominator || Number(pool.rewardDenominator) === 0;

    const priceDisplay = useMemo(() => {
        if (isDynamic) return "Dynamic";
        try {
            const denominator = safeDecimal(pool?.rewardDenominator);
            const numerator = safeDecimal(pool?.rewardNumerator);
            if (numerator.isZero()) return "Dynamic";
            const price = denominator.div(numerator);
            return shortenNumber({ number: price.toNumber() });
        } catch {
            return "Dynamic";
        }
    }, [
        isDynamic,
        pool?.rewardDenominator,
        pool?.rewardNumerator,
        paymentTokenDisplay.symbol,
        saleTokenDisplay.symbol,
    ]);

    const claimPolicyStr = poolDetail?.pool?.claimPolicy;
    const distributionModeStr = poolDetail?.pool?.distributionMode;

    const claimPolicy =
        claimPolicyStr === "instant"
            ? "Instant"
            : claimPolicyStr === "after_end"
                ? "After End"
                : "-";

    const distributionMode =
        claimPolicyStr === "after_end"
            ? distributionModeStr === "automatic"
                ? "Auto Distribution"
                : distributionModeStr === "claim"
                    ? "Claim Mode"
                    : "-"
            : null;

    const {
        formatted: balanceFormatted,
        balance: balanceRaw,
        isLoading: isLoadingBalance,
        refetch: refetchBalance,
    } = useTokenBalance({
        tokenAddress: pool?.tokenIn,
        decimals: pool?.tokenInDecimals,
        symbol: pool?.tokenInSymbol,
    });

    // Max deposit allowed by remaining pool capacity (fixed pools only)
    const hardcapHuman = useMemo(() => {
        if (isDynamic || !pool) return undefined;
        try {
            const rewardDec = pool.rewardTokenDecimals ?? 0;
            const paymentDec = pool.tokenInDecimals ?? 0;
            const num = safeDecimal(pool.rewardNumerator);
            if (num.isZero()) return undefined;
            const currentRewardHuman = safeDecimal(pool.currentRewardAmount).div(
                new Decimal(10).pow(rewardDec),
            );
            const price = safeDecimal(pool.rewardDenominator).div(num);
            const totalCapacity = currentRewardHuman.mul(price);
            const totalRaisedHuman = safeDecimal(
                poolDetail?.launchpad?.totalRaised ?? "0",
            ).div(new Decimal(10).pow(paymentDec));
            const remaining = totalCapacity.sub(totalRaisedHuman);
            return remaining.lte(0) ? "0" : remaining.toFixed(paymentDec);
        } catch {
            return undefined;
        }
    }, [isDynamic, pool, poolDetail?.launchpad?.totalRaised]);

    const depositFormSchema = useMemo(
        () =>
            createDepositFormSchema({
                decimals: pool?.tokenInDecimals ?? 0,
                rawBalance: balanceRaw,
                balanceFormatted,
                symbol: paymentTokenDisplay.symbol,
                hardcapHuman,
            }),
        [
            balanceRaw,
            balanceFormatted,
            paymentTokenDisplay.symbol,
            pool?.tokenInDecimals,
            hardcapHuman,
        ],
    );

    const {
        handleSubmit,
        setValue,
        reset,
        control,
        watch,
        formState: { errors, isSubmitting, isValid },
    } = useForm<DepositFormValues>({
        defaultValues: { amount: "" },
        resolver: zodResolver(depositFormSchema),
        mode: "onChange",
    });

    const yourTotalDeposited = poolDetail?.launchpad?.user?.depositedAmount
        ? formatAmount(
            poolDetail.launchpad.user.depositedAmount,
            pool?.tokenInDecimals ?? 0,
        )
        : "0";

    const amountStr = watch("amount");

    // Allocation / fee estimation rows — 3 cases depending on pool mode + visibility
    const estRows = useMemo(() => {
        if (!pool) return null;
        const saleSymbol = saleTokenDisplay.symbol;
        const rewardDec = pool.rewardTokenDecimals ?? 0;
        const paymentDec = pool.tokenInDecimals ?? 0;
        // feeRate = settlementFee / (DECIMAL_FEE_PERCENT * 100) — e.g. 150 / 10000 = 1.5%
        const feeRate = pool.settlementFee
            ? safeDecimal(pool.settlementFee).div(DECIMAL_FEE_PERCENT).div(100)
            : new Decimal(0);
        const amt = safeDecimalParse({ value: amountStr });
        const hasAmount = !!(amt && amt.gt(0));
        const addAmt = hasAmount ? amt! : new Decimal(0);

        // Previous deposits by this user (in human payment units)
        const yourDepositedHuman = safeDecimal(
            poolDetail?.launchpad?.user?.depositedAmount ?? "0",
        ).div(new Decimal(10).pow(paymentDec));

        if (!isDynamic) {
            // TH1: Fixed pool — fee is charged on reward (sale) tokens
            try {
                const num = safeDecimal(pool.rewardNumerator);
                const denom = safeDecimal(pool.rewardDenominator);
                const totalUserAmount = yourDepositedHuman.add(addAmt);
                // gross allocation in sale tokens
                const grossAllocation = !denom.isZero()
                    ? totalUserAmount.mul(num).div(denom)
                    : new Decimal(0);
                const fee = grossAllocation.mul(feeRate); // fee in sale tokens
                const netAllocation = grossAllocation.sub(fee);
                return [
                    {
                        label: "Allocation",
                        value: `${shortenNumber({ number: netAllocation.toNumber() })} ${saleSymbol}`,
                    },
                    {
                        label: "Fee",
                        value: `${shortenNumber({ number: fee.toNumber() })} ${saleSymbol}`,
                    },
                ];
            } catch {
                return null;
            }
        }

        // Dynamic pool
        if (!pool.rewardVisibility) {
            // TH3: visibility OFF — values unknown
            const hasDeposit = yourDepositedHuman.gt(0) || addAmt.gt(0);
            const tbd = hasDeposit ? (
                <TBDTooltip
                    classNames={{ container: "gap-2" }}
                    tooltipProps={{ classNames: { icon: "size-3.5 text-xs" } }}
                />
            ) : (
                <span>0 {saleSymbol}</span>
            );
            return [
                { label: "Est. Allocation", value: tbd },
                { label: "Est. Fee", value: tbd },
            ];
        }

        // TH2: Dynamic, visibility ON — proportional estimate
        // estAllocation = (yourDeposited + amount) / (totalRaised + amount) * rewardPool
        try {
            const totalRaisedHuman = safeDecimal(
                poolDetail?.launchpad?.totalRaised ?? "0",
            ).div(new Decimal(10).pow(paymentDec));
            const rewardPoolHuman = safeDecimal(pool.currentRewardAmount).div(
                new Decimal(10).pow(rewardDec),
            );
            const newTotal = totalRaisedHuman.add(addAmt);
            const newYours = yourDepositedHuman.add(addAmt);
            const grossAllocation = newTotal.isZero()
                ? new Decimal(0)
                : newYours.div(newTotal).mul(rewardPoolHuman);
            const estFee = grossAllocation.mul(feeRate); // fee in sale tokens
            const netAllocation = grossAllocation.sub(estFee);
            return [
                {
                    label: "Est. Allocation",
                    value: `${shortenNumber({ number: netAllocation.toNumber() })} ${saleSymbol}`,
                },
                {
                    label: "Est. Fee",
                    value: `${shortenNumber({ number: estFee.toNumber() })} ${saleSymbol}`,
                },
            ];
        } catch {
            return [
                { label: "Est. Allocation", value: "—" },
                { label: "Est. Fee", value: "—" },
            ];
        }
    }, [
        isDynamic,
        pool,
        poolDetail,
        amountStr,
        saleTokenDisplay.symbol,
        paymentTokenDisplay.symbol,
    ]);

    const handleSelectPercent = (percent: number) => {
        if (!balanceFormatted || pool?.tokenInDecimals == null) return;
        try {
            const balanceBase = parseUnits(balanceFormatted, pool.tokenInDecimals);
            if (balanceBase === 0n) return;
            const amountBase =
                percent === 100 ? balanceBase : (balanceBase * BigInt(percent)) / 100n;
            const formatted = formatUnits(amountBase, pool.tokenInDecimals);
            const [integer, decimal] = formatted.split(".");
            const trimmed = decimal ? `${integer}.${decimal.slice(0, 6)}` : integer;
            setValue("amount", trimmed, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const onSubmit = async (data: DepositFormValues) => {
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
                                    variant: "launchpad",
                                    custom: "rounded-xl",
                                }),
                                getVariantShadowClassName({ variant: "launchpad" }),
                            )}
                        >
                            <div
                                className={cn(
                                    "h-fit w-full rounded-xl px-3 py-4 sm:px-6 2xl:py-8",
                                    getVariantBgClassName({ variant: "launchpad" }),
                                )}
                            >
                                <DialogHeader className="mb-4 text-center">
                                    <DialogTitle className="mb-2 font-orbitron text-2xl font-semibold uppercase sm:text-3xl xl:text-4xl 2xl:mb-4">
                                        Deposit
                                    </DialogTitle>
                                    {/* <p className="font-inter text-sm text-mb-gray-b8 sm:text-base 2xl:text-xl">
                                        Deposit payment tokens to participate in this launchpad pool
                                    </p> */}
                                </DialogHeader>

                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="flex flex-col gap-2 font-inter 2xl:gap-6"
                                >
                                    {/* Pool Summary */}
                                    <div
                                        className={cn(
                                            "rounded-xl",
                                            getVariantShadowClassName({ variant: "launchpad" }),
                                            getVariantBorderClassName({ variant: "launchpad" }),
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "rounded-t-xl px-5 py-3 text-center font-orbitron font-semibold sm:text-lg 2xl:text-2xl",
                                                getVariantBgClassName({ variant: "launchpad" }),
                                            )}
                                        >
                                            Pool Summary
                                        </div>
                                        <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-launchpad-border [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-launchpad-border">
                                            <SummaryRow label="Pool Type" value="Launchpad" />
                                            <SummaryRow
                                                label="Network"
                                                value={
                                                    <NetworkDisplay
                                                        chainId={pool?.chainId ?? ""}
                                                        hasLabel
                                                        classNames={{
                                                            container: "flex items-center justify-center",
                                                            img: "sm:size-4",
                                                        }}
                                                    />
                                                }
                                            />
                                            <SummaryRow
                                                label="Mode"
                                                value={isDynamic ? "Dynamic" : "Fixed"}
                                            />
                                            <SummaryRow
                                                label="Sale Token"
                                                value={
                                                    <span className="flex items-center gap-1.5">
                                                        <TokenImage
                                                            src={saleTokenDisplay.imageUri}
                                                            alt={saleTokenDisplay.symbol}
                                                            classNames={{
                                                                common: "size-4",
                                                                img: "size-4",
                                                                placeholder: "size-4",
                                                            }}
                                                        />
                                                        {saleTokenDisplay.symbol}
                                                    </span>
                                                }
                                            />
                                            <SummaryRow label="Price" value={priceDisplay} />
                                            <SummaryRow
                                                label="Payment Token"
                                                value={
                                                    <span className="flex items-center gap-1.5">
                                                        <TokenImage
                                                            src={paymentTokenDisplay.imageUri}
                                                            alt={paymentTokenDisplay.symbol}
                                                            classNames={{
                                                                common: "size-4",
                                                                img: "size-4",
                                                                placeholder: "size-4",
                                                            }}
                                                        />
                                                        {paymentTokenDisplay.symbol}
                                                    </span>
                                                }
                                            />
                                            <SummaryRow label="Claim Policy" value={claimPolicy} />
                                            {distributionMode ? (
                                                <SummaryRow
                                                    label="Distribution Mode"
                                                    value={distributionMode}
                                                />
                                            ) : (
                                                <div />
                                            )}
                                        </div>
                                    </div>

                                    {/* Your Total Deposited */}
                                    <div className="flex items-center justify-between">
                                        <span className="font-inter text-base font-medium sm:text-xl 2xl:text-2xl">
                                            Your Total Deposited
                                        </span>
                                        <span className="font-inter text-base font-bold text-nowrap sm:text-xl 2xl:text-2xl">
                                            {yourTotalDeposited} {paymentTokenDisplay.symbol}
                                        </span>
                                    </div>

                                    {/* Remaining Capacity (fixed pools only) */}
                                    {!isDynamic && hardcapHuman && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-inter text-sm font-medium text-mb-gray-b8 sm:text-base 2xl:text-xl">
                                                Remaining Capacity
                                            </span>
                                            <span className="font-inter text-sm font-bold text-nowrap sm:text-base 2xl:text-xl">
                                                {shortenNumber({ number: Number(hardcapHuman) })}{" "}
                                                {paymentTokenDisplay.symbol}
                                            </span>
                                        </div>
                                    )}

                                    {/* Amount Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1 text-sm md:text-base">
                                            <span>Deposited Amount</span>
                                            <span className="flex items-center gap-1 text-mb-gray-profile">
                                                <IconWallet className="size-4" />
                                                {isLoadingBalance ? (
                                                    <Skeleton className="h-4 w-20" />
                                                ) : (
                                                    <>
                                                        {shortenNumber({
                                                            number: Number(balanceFormatted ?? 0),
                                                        })}{" "}
                                                        {paymentTokenDisplay.symbol}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <Controller
                                                name="amount"
                                                control={control}
                                                render={({ field }) => (
                                                    <NumericInput
                                                        inputComponent={Input}
                                                        variant="launchpad"
                                                        placeholder="0.00"
                                                        className="w-full border-2 border-foreground"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        ref={field.ref}
                                                        name={field.name}
                                                        onBlur={field.onBlur}
                                                    />
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    "flex items-center gap-2 rounded-xl border-2 border-foreground bg-mb-dark-popover px-2 sm:px-4",
                                                )}
                                            >
                                                {!pool ? (
                                                    <>
                                                        <Skeleton className="size-5 rounded-full" />
                                                        <Skeleton className="h-5 w-12" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <TokenImage
                                                            src={paymentTokenDisplay.imageUri}
                                                            alt={paymentTokenDisplay.symbol}
                                                            classNames={{
                                                                common: "size-5",
                                                                img: "size-5",
                                                                placeholder: "size-5",
                                                            }}
                                                        />
                                                        <span className="font-inter text-sm font-medium text-nowrap sm:text-base">
                                                            {paymentTokenDisplay.symbol}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {errors.amount && (
                                            <p className="px-1 text-xs text-destructive md:text-sm">
                                                {errors.amount.message}
                                            </p>
                                        )}

                                        {/* Percent buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            {[25, 50, 75, 100].map((pct) => (
                                                <button
                                                    key={pct}
                                                    type="button"
                                                    onClick={() => handleSelectPercent(pct)}
                                                    className={cn(
                                                        "rounded-full border border-foreground bg-mb-dark-popover px-2.5 py-1 font-inter text-sm font-medium text-white transition hover:bg-mb-btn-launchpad",
                                                        // getVariantBorderClassName({ variant: "launchpad" }),
                                                    )}
                                                >
                                                    {pct === 100 ? "Max" : `${pct}%`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Allocation / Fee estimate */}
                                    {estRows && (
                                        <div className="space-y-1">
                                            {estRows.map((row) => (
                                                <div
                                                    key={row.label}
                                                    className="flex items-center justify-between"
                                                >
                                                    <span className="font-inter text-sm font-medium text-mb-gray-b8 sm:text-base 2xl:text-xl">
                                                        {row.label}:
                                                    </span>
                                                    <span className="font-inter text-sm font-bold text-nowrap sm:text-base 2xl:text-xl">
                                                        {row.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="launchpad"
                                            hasHover
                                            className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="launchpad"
                                            hasHover
                                            isLoading={isSubmitting}
                                            disabled={!isValid || isSubmitting}
                                            className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                                        >
                                            Deposit
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

export default DepositDialog;
