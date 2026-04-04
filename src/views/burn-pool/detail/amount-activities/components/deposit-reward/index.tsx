import { IconWallet } from "@/assets/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import TokenImage from "@/components/common/token-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
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
                <SummaryRow
                  label="Pool Name"
                  value={!pool ? <Skeleton className="h-5 w-28" /> : pool.name}
                />
                <SummaryRow
                  label="Duration"
                  value={!pool ? <Skeleton className="h-5 w-36" /> : duration}
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
                        {burnTokenDisplay?.symbol ?? pool.tokenInSymbol ?? "-"}
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
                        : `${rewardBalanceFormatted ?? "0"} ${rewardTokenDisplay?.symbol ?? ""}`}
                    </span>
                  </span>
                </div>

                <div
                  className={`relative flex items-center ${
                    errors.amount ? "ring-1 ring-destructive" : ""
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
                        <span className="">
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
                  disabled: !isValid || !!insufficientBalanceMessage,
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
