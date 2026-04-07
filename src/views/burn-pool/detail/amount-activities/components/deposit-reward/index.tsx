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
import { useGetWhitelistTokens } from "@/services/queries/queries";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import {
  toBaseUnits,
  shortenNumber,
  safeDecimalParse,
} from "@/utils/helpers/numbers";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";
import { Skeleton } from "@/components/ui/skeleton";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";
import z from "zod";
import type { PoolDetailResponse } from "@/types/pool";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  <div className={cn("flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2 2xl:px-6 2xl:py-4", className)}>
    <div className="text-sm font-medium text-mb-gray-b8 sm:text-base 2xl:text-xl">{label}</div>
    <div className="text-sm sm:text-base 2xl:text-xl">
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
    formatted: rewardBalanceFormatted,
    isLoading: isLoadingRewardBalance,
    refetch: refetchRewardBalance,
  } = useTokenBalance({
    tokenAddress: pool?.rewardToken,
    decimals: pool?.rewardTokenDecimals,
    symbol: pool?.rewardTokenSymbol,
  });

  const depositFormSchema = useMemo(
    () => createDepositFormSchema({ maxAmount: rewardBalanceFormatted }),
    [rewardBalanceFormatted],
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

  const { isLoading: isLoadingWhitelistTokens } = useGetWhitelistTokens();

  const networkConfig = useMemo(
    () => (pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined),
    [pool?.chainId],
  );

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

  const currentRewardFormatted = useMemo(() => {
    if (!pool) return "-";
    const raw =
      Number(pool.currentRewardAmount) / Math.pow(10, pool.rewardTokenDecimals);
    return `${shortenNumber({ number: raw })} ${rewardTokenDisplay?.symbol ?? pool.rewardTokenSymbol}`;
  }, [pool, rewardTokenDisplay]);

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

  const insufficientBalanceMessage = useMemo(() => {
    if (!amountStr || !rewardBalanceFormatted || isLoadingRewardBalance)
      return undefined;
    const amountDecimal = safeDecimalParse({ value: amountStr });
    const balanceDecimal = safeDecimalParse({ value: rewardBalanceFormatted });
    if (!amountDecimal || !balanceDecimal) return undefined;
    if (amountDecimal.lte(0) || amountDecimal.lte(balanceDecimal))
      return undefined;
    return `Amount exceeds wallet balance (${rewardBalanceFormatted} ${rewardTokenDisplay?.symbol ?? pool?.rewardTokenSymbol ?? ""})`;
  }, [
    amountStr,
    rewardBalanceFormatted,
    isLoadingRewardBalance,
    rewardTokenDisplay,
    pool,
  ]);

  const onSubmit = async (data: DepositFormValues) => {
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
                  "h-fit w-full rounded-xl px-3 sm:px-6 py-4 2xl:py-8",
                  getVariantBgClassName({ variant: "burn" }),
                )}
              >
                <DialogHeader className="mb-4 text-center">
                  <DialogTitle className="mb-2 font-orbitron text-2xl font-semibold uppercase sm:text-3xl xl:text-4xl 2xl:mb-4">
                    Deposit <br className="sm:hidden" />Reward Token
                  </DialogTitle>
                  <p className="font-inter text-sm text-mb-gray-b8 sm:text-base 2xl:text-xl">
                    Fund reward tokens for this burn pool
                  </p>
                </DialogHeader>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col font-inter gap-2 2xl:gap-6"
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
                        label="Duration"
                        value={
                          !pool ? <Skeleton className="h-5 w-36" /> : duration
                        }
                      />
                      <SummaryRow
                        label="Reward Token"
                        value={
                          !pool || isLoadingTokenOut ? (
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
                              {rewardTokenDisplay?.symbol ??
                                pool.rewardTokenSymbol ??
                                "-"}
                            </span>
                          )
                        }
                      />
                      <SummaryRow
                        label="Burn token"
                        value={
                          !pool || isLoadingTokenIn ? (
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
                              {burnTokenDisplay?.symbol ??
                                pool.tokenInSymbol ??
                                "-"}
                            </span>
                          )
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
                        label="Network"
                        value={
                          !pool ? (
                            <Skeleton className="h-5 w-24" />
                          ) : (
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
                          )
                        }
                      />
                      <div className="col-span-2">
                        <SummaryRow
                          label="Burn Method"
                          value={
                            <span className="text-mb-burn font-semibold">
                              Burn
                            </span>
                          }
                          className="flex-row items-center justify-between"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 2xl:space-y-6">
                    {/* Current Reward Amount */}
                    <div className="flex items-center justify-between text-mb-burn-light">
                      <span className="font-inter text-base font-medium sm:text-xl 2xl:text-2xl">
                        Current Reward Amount
                      </span>
                      <span className="font-inter text-base text-nowrap font-bold sm:text-xl 2xl:text-2xl">
                        {!pool ? (
                          <Skeleton className="h-8 w-36" />
                        ) : (
                          currentRewardFormatted
                        )}
                      </span>
                    </div>

                    {/* Deposit Amount Input */}
                    <div className="space-y-2 2xl:space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="font-inter text-sm font-medium sm:text-base 2xl:text-xl">
                          Deposit Amount
                        </label>
                        <span className="flex items-center gap-2 font-inter text-nowrap text-sm sm:text-base 2xl:text-xl">
                          <IconWallet className="text-mb-gray-b8"/>
                          {isLoadingRewardBalance
                            ? "Loading..."
                            : `${shortenNumber({ number: Number(rewardBalanceFormatted) }) ?? "0"} ${rewardTokenDisplay?.symbol ?? ""}`}
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
                            "flex items-center gap-2 rounded-md bg-mb-dark-popover px-2 sm:px-4 text-mb-burn-light",
                            getVariantBorderClassName({ variant: "burn" }),
                          )}
                        >
                          {!pool || isLoadingTokenOut ? (
                            <>
                              <Skeleton className="size-5 rounded-full" />
                              <Skeleton className="h-5 w-12" />
                            </>
                          ) : (
                            <>
                              <TokenImage
                                src={rewardTokenDisplay?.imageUri}
                                alt={rewardTokenDisplay?.symbol}
                                classNames={{
                                  common: "size-5",
                                  img: "size-5",
                                  placeholder: "size-5",
                                }}
                              />
                              <span className="font-inter text-sm font-medium sm:text-base">
                                {rewardTokenDisplay?.symbol ??
                                  pool.rewardTokenSymbol ??
                                  ""}
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

export default DepositRewardDialog;
