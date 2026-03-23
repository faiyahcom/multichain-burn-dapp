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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useMemo } from "react";
import { formatUnits, parseUnits } from "viem";
import { formatAmount, shortenNumber, safeDecimalParse } from "@/utils/helpers/numbers";
import { Input } from "@/components/ui/input";
import { IconWallet } from "@/assets/react";
import TokenImage from "@/components/common/token-image";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";

const createDepositFormSchema = ({
  maxAmount,
}: {
  maxAmount: string | undefined;
}) => {
  return z.object({
    amount: z
        .string()
        .min(0, { message: "Amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Amount must be a positive number",
        })
        .refine((value) => {
            const decimal = safeDecimalParse({ value });
            return decimal && decimal.decimalPlaces() <= 6;
        }, {
            message: "Amount must have 6 decimals or less",
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
    formState: { errors, isSubmitting },
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
      setValue("amount", formatted, { shouldValidate: true });
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
            Number(poolDetail.pool.rewardAmount) /
            Math.pow(10, decimals);
        const yourCurrentDeposited =
            Number(poolDetail?.userAmount?.deposited) /
            Math.pow(10, poolDetail.pool.tokenInDecimals);
        const reward =
            ((amount + yourCurrentDeposited) / (totalDeposited + amount)) *
            rewardPool;
        return `${shortenNumber({ number: reward })} ${rewardSymbol}`;
    }, [poolDetail, rewardTokenDisplay, ratio, amountStr]);

    const insufficientBalanceMessage = useMemo(() => {
        if (!amountStr || !burnBalanceFormatted || isLoadingBurnBalance) return undefined;
        const amountDecimal = safeDecimalParse({ value: amountStr });
        const balanceDecimal = safeDecimalParse({ value: burnBalanceFormatted });
        if (!amountDecimal || !balanceDecimal) return undefined;
        if (amountDecimal.lte(0) || amountDecimal.lte(balanceDecimal)) return undefined;
        return `Amount exceeds wallet balance (${burnBalanceFormatted} ${burnTokenDisplay?.symbol ?? pool?.tokenInSymbol ?? ""})`;
    }, [amountStr, burnBalanceFormatted, isLoadingBurnBalance, burnTokenDisplay, pool]);

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
                <SummaryRow
                  label="Pool Name"
                  value={!pool ? <Skeleton className="h-5 w-28" /> : pool.name}
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
                    !pool ? <Skeleton className="h-5 w-24" /> : formattedReward
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

            <div className="space-y-9 px-12">
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium text-foreground">
                  Current Burned Amount
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {!poolDetail ? (
                    <Skeleton className="h-8 w-36" />
                  ) : (
                    currentBurnFormatted
                  )}
                </span>
              </div>
              {/* Deposit Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Your Deposited Amount</span>
                  <span className="flex items-center space-x-2 font-medium text-foreground">
                    {!poolDetail ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      <span>
                        {formattedCurrentDepositedAmount ?? "0"}{" "}
                        {burnTokenDisplay?.symbol ?? ""}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deposit Amount</span>
                  <span className="flex items-center space-x-2 text-secondary-text">
                    <IconWallet />
                    <span>
                      {isLoadingBurnBalance
                        ? "Loading..."
                        : `${burnBalanceFormatted ?? "0"} ${burnTokenDisplay?.symbol ?? ""}`}
                    </span>
                  </span>
                </div>

                                <div
                                    className={`relative flex items-center ${errors.amount ? "ring-1 ring-destructive" : ""}`}
                                >
                                    <Input
                                        {...register("amount")}
                                        type="number"
                                        step={DEFAULT_INPUT_NUMBER_STEP}
                                        placeholder="Enter amount"
                                        className="h-full flex-1 px-10 py-2 text-base"
                                    />
                                    <div className="absolute right-0 flex h-full items-center gap-2 rounded-md-plus bg-mb-summary-token-card px-12.5 py-2 text-lg">
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
                                                <span>{burnTokenDisplay?.symbol ?? ""}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {errors.amount && (
                                    <p className="text-xs text-destructive">
                                        {errors.amount.message}
                                    </p>
                                )}
                                {insufficientBalanceMessage && (
                                    <p className="text-xs text-destructive">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-medium text-active">
                    Estimated Reward:
                  </span>
                  <span className="text-2xl font-bold text-active">
                    {!poolDetail ? (
                      <Skeleton className="h-8 w-40" />
                    ) : (
                      estmatedReward
                    )}
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
                                    disabled: isSubmitting || !!insufficientBalanceMessage,
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
