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
  shortenNumber,
} from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";
import z from "zod";

const createDepositFormSchema = ({
  maxAmount,
}: {
  maxAmount: string | undefined;
}) => {
  return z.object({
    amount: z
      .string()
      .min(1, { error: "Amount is required" })
      .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
        error: "Amount must be a positive number",
      })
      .refine(
        (value) => {
          const decimal = safeDecimalParse({ value });
          return decimal && decimal.decimalPlaces() <= 6;
        },
        {
          error: "Amount must have 6 decimals or less",
        },
      )
      .refine(
        (value) => {
          if (maxAmount === undefined || isNaN(Number(maxAmount))) return true;
          return Number(value) <= Number(maxAmount);
        },
        { error: `Amount must not exceed ${maxAmount}` },
      ),
  });
};

// type DepositFormValues = z.infer<typeof depositFormSchema>;
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

const DepositBurnDialog = ({
  open,
  onOpenChange,
  poolDetail,
  onConfirm,
}: Props) => {
  const pool = poolDetail?.pool;
  const {
    formatted: burnBalanceFormatted,
    isLoading: isLoadingBurnBalance,
    refetch: refetchBurnBalance,
  } = useTokenBalance({
    tokenAddress: pool?.tokenIn,
    decimals: pool?.tokenInDecimals,
    symbol: pool?.tokenInSymbol,
  });

  const depositFormSchema = useMemo(
    () => createDepositFormSchema({ maxAmount: burnBalanceFormatted }),
    [burnBalanceFormatted],
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DepositFormValues>({
    defaultValues: { amount: "" },
    resolver: zodResolver(depositFormSchema),
  });

  const amountStr = watch("amount");

  const formattedReward = poolDetail
    ? formatAmount(
      poolDetail.pool.currentRewardAmount,
      poolDetail.pool.rewardTokenDecimals,
    )
    : "-";

  const yourCurrentDepositedAmount = poolDetail?.userAmount?.deposited;
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

      // Keep max decimal part 6 digits
      const [integer, decimal] = formatted.split(".");
      const newFormattedAmount =
        decimal && decimal.length > 0
          ? `${integer}.${decimal.slice(0, 6)}`
          : integer;

      setValue("amount", newFormattedAmount, { shouldValidate: true });
    } catch {
      return;
    }
  };

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
    return `${shortenNumber({ number: raw })} ${burnTokenDisplay?.symbol ?? poolDetail.pool.tokenInSymbol}`;
  }, [poolDetail, burnTokenDisplay]);

  const estmatedReward = useMemo(() => {
    if (!poolDetail) return "-";
    const rewardSymbol =
      rewardTokenDisplay?.symbol ?? poolDetail.pool.rewardTokenSymbol;
    const decimals = poolDetail.pool.rewardTokenDecimals;
    if (!amountStr) return `0 ${rewardSymbol}`;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return `0 ${rewardSymbol}`;
    const totalDeposited =
      Number(poolDetail.depositedAmount) /
      Math.pow(10, poolDetail.pool.tokenInDecimals);
    const rewardPool =
      Number(poolDetail.pool.rewardAmount) / Math.pow(10, decimals);
    const yourCurrentDeposited =
      Number(poolDetail?.userAmount?.deposited) /
      Math.pow(10, poolDetail.pool.tokenInDecimals);
    const reward =
      ((amount + yourCurrentDeposited) / (totalDeposited + amount)) *
      rewardPool;
    return `${shortenNumber({ number: reward })} ${rewardSymbol}`;
  }, [poolDetail, rewardTokenDisplay, ratio, amountStr]);

  const insufficientBalanceMessage = useMemo(() => {
    if (!amountStr || !burnBalanceFormatted || isLoadingBurnBalance)
      return undefined;
    const amountDecimal = safeDecimalParse({ value: amountStr });
    const balanceDecimal = safeDecimalParse({ value: burnBalanceFormatted });
    if (!amountDecimal || !balanceDecimal) return undefined;
    if (amountDecimal.lte(0) || amountDecimal.lte(balanceDecimal))
      return undefined;
    return `Amount exceeds wallet balance (${burnBalanceFormatted} ${burnTokenDisplay?.symbol ?? pool?.tokenInSymbol ?? ""})`;
  }, [
    amountStr,
    burnBalanceFormatted,
    isLoadingBurnBalance,
    burnTokenDisplay,
    pool,
  ]);

  const onSubmit = async (data: DepositFormValues) => {
    await onConfirm(data.amount);
    refetchBurnBalance();
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
                  variant: "burn",
                  custom: "rounded-xl",
                }),
                getVariantShadowClassName({ variant: "burn" }),
              )}
            >
              <div
                className={cn(
                  "h-fit w-full rounded-xl px-6 py-8",
                  getVariantBgClassName({ variant: "burn" }),
                )}
              >
                <DialogHeader className="mb-4 text-center">
                  <DialogTitle className="mb-2 font-orbitron text-2xl font-semibold uppercase sm:text-3xl xl:text-4xl 2xl:mb-4">
                    Deposit <br className="sm:hidden" />
                    Token Burn
                  </DialogTitle>
                  <p className="font-inter text-sm text-mb-gray-b8 sm:text-base 2xl:text-xl">
                    Burn token to participate in this pool
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
                      getVariantShadowClassName({ variant: "burn" }),
                      getVariantBorderClassName({ variant: "burn" }),
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-t-xl px-5 py-3 text-center font-orbitron font-semibold sm:text-lg 2xl:text-2xl",
                        getVariantBgClassName({ variant: "burn" }),
                      )}
                    >
                      Pool Summary
                    </div>
                    <div className="grid grid-cols-2 [&>*:nth-child(even)]:border-l [&>*:nth-child(even)]:border-burn-border [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-burn-border">
                      <SummaryRow
                        label="Pool Name"
                        value={
                          !pool ? <Skeleton className="h-5 w-28" /> : pool.name
                        }
                      />
                      <SummaryRow
                        label="Ratio"
                        value={
                          !pool ? (
                            <Skeleton className="h-5 w-16" />
                          ) : (
                            <span className="font-semibold">{ratio}</span>
                          )
                        }
                      />
                      <SummaryRow
                        label="Burn Token"
                        value={
                          !pool ? (
                            <Skeleton className="h-5 w-28" />
                          ) : (
                            <span className="flex items-center gap-2 font-semibold">
                              <TokenImage
                                src={burnTokenDisplay?.imageUri}
                                alt={burnTokenDisplay?.symbol}
                                classNames={{
                                  common: "size-5",
                                  img: "size-5",
                                  placeholder: "size-5",
                                }}
                              />
                              {burnTokenDisplay?.symbol ?? "-"}
                            </span>
                          )
                        }
                      />
                      <SummaryRow
                        label="Reward Amount"
                        value={
                          !pool ? (
                            <Skeleton className="h-5 w-24" />
                          ) : (
                            formattedReward
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
                                src={rewardTokenDisplay?.imageUri}
                                alt={rewardTokenDisplay?.symbol}
                                classNames={{
                                  common: "size-5",
                                  img: "size-5",
                                  placeholder: "size-5",
                                }}
                              />
                              {rewardTokenDisplay?.symbol ?? "-"}
                            </span>
                          )
                        }
                      />
                      <SummaryRow label="" value="" />
                    </div>
                  </div>

                  <div className="space-y-2 2xl:space-y-6">
                    {/* Current Burned Amount */}
                    <div className="flex items-center justify-between text-mb-burn-light">
                      <span className="font-inter text-sm font-medium sm:text-base 2xl:text-xl">
                        Current Burned Amount
                      </span>
                      <span className="font-inter text-md font-bold text-nowrap sm:text-lg 2xl:text-2xl">
                        {!poolDetail ? (
                          <Skeleton className="h-8 w-36" />
                        ) : (
                          currentBurnFormatted
                        )}
                      </span>
                    </div>

                    {/* Deposit Amount Input */}
                    <div className="space-y-2 2xl:space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-sm text-secondary-text sm:text-base">
                          Your Deposited Amount
                        </span>
                        <span className="font-inter text-sm font-medium sm:text-base">
                          {!poolDetail ? (
                            <Skeleton className="h-5 w-28" />
                          ) : (
                            <>
                              {formattedCurrentDepositedAmount ?? "0"}{" "}
                              {burnTokenDisplay?.symbol ?? ""}
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="font-inter text-sm font-medium sm:text-base 2xl:text-xl">
                          Deposit Burn Amount
                        </label>
                        <span className="flex items-center gap-2 font-inter text-sm text-nowrap sm:text-base 2xl:text-xl">
                          <IconWallet />
                          {isLoadingBurnBalance
                            ? "Loading..."
                            : `${shortenNumber({ number: Number(burnBalanceFormatted) ?? 0 })} ${burnTokenDisplay?.symbol ?? ""}`}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <Input
                          {...register("amount")}
                          variant="burn"
                          type="number"
                          step={DEFAULT_INPUT_NUMBER_STEP}
                          placeholder="Enter amount"
                          className="w-full border-2 bg-transparent"
                          aria-invalid={!!errors.amount}
                        />
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-md bg-mb-dark-popover px-2 text-mb-burn-light sm:px-4",
                            getVariantBorderClassName({ variant: "burn" }),
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
                                src={burnTokenDisplay?.imageUri}
                                alt={burnTokenDisplay?.symbol}
                                classNames={{
                                  common: "size-5",
                                  img: "size-5",
                                  placeholder: "size-5",
                                }}
                              />
                              <span className="font-inter text-sm font-medium sm:text-base">
                                {burnTokenDisplay?.symbol ?? ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {errors.amount && (
                        <p className="font-inter text-xs text-destructive">
                          {errors.amount.message}
                        </p>
                      )}
                      {insufficientBalanceMessage && (
                        <p className="font-inter text-xs text-destructive">
                          {insufficientBalanceMessage}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {[25, 50, 100].map((percent) => (
                          <button
                            type="button"
                            key={percent}
                            onClick={() => handleSelectPercent(percent)}
                            className={cn(
                              "rounded-full bg-mb-dark-popover px-2.5 py-1 font-inter text-sm font-medium text-mb-burn-light transition hover:bg-mb-burn-light hover:text-white",
                              getVariantBorderClassName({ variant: "burn" }),
                            )}
                          >
                            {percent === 100 ? "Max" : `${percent}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-mb-burn-light">
                        <span className="font-inter text-sm font-medium sm:text-base 2xl:text-xl">
                          Estimated Reward:
                        </span>
                        <span className="font-inter text-md font-bold text-nowrap sm:text-lg 2xl:text-2xl">
                          {!poolDetail ? (
                            <Skeleton className="h-8 w-40" />
                          ) : (
                            estmatedReward
                          )}
                        </span>
                      </div>
                      <p className="font-inter text-xs text-secondary-text sm:text-sm">
                        Reward is estimated and not fixed. Final amount will be
                        determined at claim time.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-2">
                    <Button
                      variant="burn-active"
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      hasHover
                      className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="burn"
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={!isValid || !!insufficientBalanceMessage}
                      hasHover
                      className="flex-1 font-orbitron font-semibold sm:text-xl xl:text-2xl"
                    >
                      {isSubmitting ? "Depositing..." : "Deposit"}
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

export default DepositBurnDialog;
