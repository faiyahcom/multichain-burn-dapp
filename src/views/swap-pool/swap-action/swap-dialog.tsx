import {
    Dialog,
    DialogBody,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PoolDetailResponse } from "@/types/pool";
import { toast } from "@/components/common/custom-toast";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { useSystemStore } from "@/stores/systemStore";
import {
  useSwapPoolETH,
  type EstimateSwapPoolNetworkFeeResult,
} from "./hooks/useSwapPoolETH";
import {
  useSwapPoolSOL,
  type EstimateSwapPoolNetworkFeeResult as EstimateSwapPoolSolNetworkFeeResult,
} from "./hooks/useSwapPoolSOL";
import { useEffect, useMemo, useState } from "react";
import BN from "bn.js";
import { formatUnits } from "viem";
import { chainIdToNetworkConfig } from "@/config/networks";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { getErrorMessage } from "@/utils/helpers/error-message";
import SellSection from "./components/sell-section";
import BuySection from "./components/buy-section";
import FeePanel from "./components/fee-panel";
import SwapRateRow from "./components/swap-rate-row";
import { parseUnits } from "ethers";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";
import { safeDecimalParse, shortenNumber, parseToBN } from "@/utils/helpers/numbers";
import { useDebounceValue } from "usehooks-ts";
import { DECIMAL_FEE_PERCENT } from "@/views/admin/fee-settings-management/hooks/useFeeSettings";
import { cn } from "@/lib/utils";
import {
    getVariantBorderClassName,
    getVariantShadowClassName,
} from "@/components/common/glow/container";
import { IconSwapCategory } from "@/assets/react";
import { Button } from "@/components/common/glow/button";

const swapFormSchema = z.object({
    burnAmount: z
        .string()
        .min(0, { message: "Burn amount is required" })
        .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
            message: "Burn amount must be a positive number",
        })
        .refine(
            (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal && decimal?.decimalPlaces() <= 6;
            },
            {
                message: "Burn amount must have 6 decimals or less",
            },
        ),
});

export type SwapFormValues = z.infer<typeof swapFormSchema>;

const SELL_INPUT_DEBOUNCE_MS = 500;
const DEFAULT_NETWORK_FEE_TOOLTIP = "Estimated gas fee for the transaction";

type NetworkFeeState = {
  display: string;
  tooltip: string;
};

const DEFAULT_NETWORK_FEE_STATE: NetworkFeeState = {
  display: "-",
  tooltip: DEFAULT_NETWORK_FEE_TOOLTIP,
};

const ESTIMATING_NETWORK_FEE_STATE: NetworkFeeState = {
  display: "Estimating...",
  tooltip: DEFAULT_NETWORK_FEE_TOOLTIP,
};

const formatBalanceDisplay = (value?: string) => {
  if (!value) return "0";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  return String(shortenNumber({ number: numericValue }));
};

const formatNetworkFeeDisplay = ({
  amount,
  decimals,
  symbol,
}: {
  amount: bigint;
  decimals: number;
  symbol: string;
}) => {
  const formatted = formatUnits(amount, decimals);
  const numericValue = Number(formatted);

  if (!Number.isFinite(numericValue)) {
    return `${formatted} ${symbol}`;
  }

  if (numericValue > 0 && numericValue < 0.000001) {
    return `<0.000001 ${symbol}`;
  }

  return `${shortenNumber({
    number: numericValue,
    decimalPlaces: 6,
  })} ${symbol}`;
};

const formatGasUnits = (value: bigint) => value.toLocaleString("en-US");

const buildNetworkFeeTooltip = ({
  steps,
}: EstimateSwapPoolNetworkFeeResult) => {
  if (!steps.length) return DEFAULT_NETWORK_FEE_TOOLTIP;
  if (steps.length === 1 && steps[0].type === "approve") {
    return "Approval is required first; the app can estimate the full swap gas after approval succeeds.";
  }

  const actionLabel = steps.map(({ type }) => type).join(" + ");
  const gasLabel = steps
    .map(({ gasLimit }) => formatGasUnits(gasLimit))
    .join(" + ");

  return `Estimated gas fee for ${actionLabel} (~${gasLabel} gas).`;
};

const getNetworkFeeStateFromEstimate = (
  estimate: EstimateSwapPoolNetworkFeeResult,
): NetworkFeeState => {
  const lastStep = estimate.steps[estimate.steps.length - 1];
  if (!lastStep) return DEFAULT_NETWORK_FEE_STATE;

  const display = formatNetworkFeeDisplay({
    amount: estimate.totalGasCost,
    decimals: estimate.nativeDecimals,
    symbol: estimate.nativeSymbol,
  });

  return {
    display: lastStep.type === "approve" ? `${display} approve` : display,
    tooltip: buildNetworkFeeTooltip(estimate),
  };
};

const getSolanaNetworkFeeStateFromEstimate = ({
  ataCreations,
  nativeDecimals,
  nativeSymbol,
  totalGasCost,
}: EstimateSwapPoolSolNetworkFeeResult): NetworkFeeState => {
  const tokenAccountLabel =
    ataCreations === 1 ? "token account" : "token accounts";

  return {
    display: formatNetworkFeeDisplay({
      amount: totalGasCost,
      decimals: nativeDecimals,
      symbol: nativeSymbol,
    }),
    tooltip:
      ataCreations > 0
        ? `Estimated network fee for swap. Wallet may also show rent to create ${ataCreations} ${tokenAccountLabel}.`
        : "Estimated network fee for swap.",
  };
};

const getEvmNetworkFeeStateFromError = (error: unknown): NetworkFeeState => {
  const message = getErrorMessage({ error });

  if (message === "Wallet not connected") {
    return {
      display: "Connect wallet",
      tooltip: "Connect an EVM wallet to estimate the swap gas fee.",
    };
  }

  return {
    display: "Unavailable",
    tooltip: DEFAULT_NETWORK_FEE_TOOLTIP,
  };
};

const getSolanaNetworkFeeStateFromError = (error: unknown): NetworkFeeState => {
  const message = getErrorMessage({ error });

  if (
    message === "Wallet is not connected" ||
    message === "Solana connection not available"
  ) {
    return {
      display: "Connect wallet",
      tooltip: "Connect a Solana wallet to estimate the network fee.",
    };
  }

  return {
    display: "Unavailable",
    tooltip: DEFAULT_NETWORK_FEE_TOOLTIP,
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poolDetail?: PoolDetailResponse;
  poolAddress?: string;
  onSuccess: () => void;
};

const SwapDialog = ({
    open,
    onOpenChange,
    poolDetail: poolDetailProp,
    poolAddress,
    onSuccess,
}: Props) => {
    const { data: fetchedPoolDetail } = useQuery({
        queryKey: poolQueryKeys.detail(poolAddress!),
        queryFn: () => poolService.getPoolDetail(poolAddress!),
        enabled: !poolDetailProp && !!poolAddress,
    });

  const poolDetail = poolDetailProp ?? fetchedPoolDetail;

  const [openFeePopUp, setOpenFeePopUp] = useState(false);
  const [networkFee, setNetworkFee] = useState<NetworkFeeState>(
    DEFAULT_NETWORK_FEE_STATE,
  );

  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const isSolanaNetwork = selectedNetworkId === "solanaDevnet";

  const { depositSwapPool: depositSwapPoolETH, estimateSwapPoolNetworkFee } =
    useSwapPoolETH();
  const {
    depositSwapPool: depositSwapPoolSOL,
    estimateSwapPoolNetworkFee: estimateSwapPoolSolNetworkFee,
  } = useSwapPoolSOL();

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
  const [debouncedBurnAmount] = useDebounceValue(
    burnAmount,
    SELL_INPUT_DEBOUNCE_MS,
  );
  const derivedBurnAmount = burnAmount ? debouncedBurnAmount : burnAmount;
  const isSellAmountDebouncing =
    !!burnAmount && burnAmount !== derivedBurnAmount;

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

  const {
    formatted: burnBalanceFormatted,
    isLoading: isLoadingBurnBalance,
    refetch: refetchBurnBalance,
  } = useTokenBalance({
    tokenAddress: poolDetail?.pool.tokenIn,
    decimals: poolDetail?.pool.tokenInDecimals,
    symbol: poolDetail?.pool.tokenInSymbol,
  });

  const {
    formatted: rewardBalanceFormatted,
    isLoading: isLoadingRewardBalance,
    refetch: refetchRewardBalance,
  } = useTokenBalance({
    tokenAddress: poolDetail?.pool.rewardToken,
    decimals: poolDetail?.pool.rewardTokenDecimals,
    symbol: poolDetail?.pool.rewardTokenSymbol,
  });

    const handleSelectPercent = (percent: number) => {
        if (!burnBalanceFormatted || poolDetail?.pool.tokenInDecimals == null)
            return;
        try {
            const decimals = poolDetail.pool.tokenInDecimals;
            const balanceBN = new BN(
                parseUnits(burnBalanceFormatted, decimals).toString(),
            );
            if (balanceBN.isZero()) return;
            let amountBN =
                percent === 100 ? balanceBN : balanceBN.muln(percent).divn(100);
            if (maxBurnLeft && maxBurnLeft !== "0") {
                const maxBurnRawBN = new BN(
                    parseUnits(maxBurnLeft, decimals).toString(),
                );
                if (amountBN.gt(maxBurnRawBN)) {
                    amountBN = maxBurnRawBN;
                }
            }
            const formatted = formatUnits(BigInt(amountBN.toString()), decimals);
            // Keep max decimal part 6 digits
            const [integer, decimal] = formatted.split(".");
            const newFormattedAmount =
                decimal && decimal.length > 0
                    ? `${integer}.${decimal.slice(0, 6)}`
                    : integer;
            setValue("burnAmount", newFormattedAmount, { shouldValidate: true });
        } catch {
            return;
        }
    };

    const maxBurnLeft = useMemo(() => {
        if (!poolDetail) return "0";
        try {
            const numeratorBN = parseToBN(poolDetail.pool.rewardNumerator);
            const denominatorBN = parseToBN(poolDetail.pool.rewardDenominator);
            if (numeratorBN.isZero() || denominatorBN.isZero()) return "0";
            const rewardDecimals = poolDetail.pool.rewardTokenDecimals;
            const burnDecimals = poolDetail.pool.tokenInDecimals;
            const rewardAmountBN = parseToBN(poolDetail.rewardAmount);
            const rewardDecimalsBN = new BN(10).pow(new BN(rewardDecimals));
            const burnDecimalsBN = new BN(10).pow(new BN(burnDecimals));
            const maxBurnRaw = rewardAmountBN
                .mul(denominatorBN)
                .mul(burnDecimalsBN)
                .div(numeratorBN.mul(rewardDecimalsBN));
            const depositedBN = parseToBN(poolDetail.depositedAmount);
            const remaining = maxBurnRaw.sub(depositedBN);
            if (remaining.isNeg()) return "0";
            return formatUnits(BigInt(remaining.toString()), burnDecimals);
        } catch {
            return "0";
        }
    }, [poolDetail]);

  const isExceedingMax =
    !!derivedBurnAmount &&
    Number(derivedBurnAmount) > 0 &&
    Number(maxBurnLeft) > 0 &&
    Number(derivedBurnAmount) > Number(maxBurnLeft);

  const insufficientBalanceMessage = useMemo(() => {
    if (!derivedBurnAmount || !burnBalanceFormatted || isLoadingBurnBalance) {
      return undefined;
    }

        const burnAmountDecimal = safeDecimalParse({ value: derivedBurnAmount });
        const burnBalanceDecimal = safeDecimalParse({
            value: burnBalanceFormatted,
        });

    if (!burnAmountDecimal || !burnBalanceDecimal) return undefined;
    if (burnAmountDecimal.lte(0) || burnAmountDecimal.lte(burnBalanceDecimal)) {
      return undefined;
    }

    return `Amount exceeds wallet balance (${formatBalanceDisplay(burnBalanceFormatted)} ${burnTokenDisplay?.symbol ?? ""})`;
  }, [
    derivedBurnAmount,
    burnBalanceFormatted,
    burnTokenDisplay?.symbol,
    isLoadingBurnBalance,
  ]);

  const isInsufficientBalance = !!insufficientBalanceMessage;

  const formattedEstimatedRewardAmount = useMemo(() => {
    if (!derivedBurnAmount || !poolDetail) return "0";

    try {
      const {
        tokenInDecimals,
        rewardTokenDecimals,
        rewardNumerator,
        rewardDenominator,
        settlementFee,
      } = poolDetail.pool;

      const amountInBN = new BN(
        parseUnits(derivedBurnAmount || "0", tokenInDecimals).toString(),
      );

      if (amountInBN.isZero()) return "0";

            const numeratorBN = parseToBN(rewardNumerator);
            const denominatorBN = parseToBN(rewardDenominator);

      const rewardDecimalsBN = new BN(10).pow(new BN(rewardTokenDecimals));
      const tokenDecimalsBN = new BN(10).pow(new BN(tokenInDecimals));

      const rewardBN = amountInBN
        .mul(numeratorBN)
        .mul(rewardDecimalsBN)
        .div(denominatorBN.mul(tokenDecimalsBN));

            const feeBN = rewardBN
                .mul(parseToBN(settlementFee))
                .div(new BN(DECIMAL_FEE_PERCENT * 100));

      const finalReward = rewardBN.sub(feeBN);

            const formatted = formatUnits(
                BigInt(finalReward.toString()),
                rewardTokenDecimals,
            );
            const num = Number(formatted);
            if (!Number.isFinite(num)) return formatted;
            return String(shortenNumber({ number: num }));
        } catch {
            return "0";
        }
    }, [derivedBurnAmount, poolDetail]);

  useEffect(() => {
    let cancelled = false;

    if (!open || !poolDetail) {
      setNetworkFee(DEFAULT_NETWORK_FEE_STATE);
      return () => {
        cancelled = true;
      };
    }

    const parsedBurnAmount = derivedBurnAmount
      ? safeDecimalParse({ value: derivedBurnAmount })
      : null;

    if (!parsedBurnAmount || parsedBurnAmount.lte(0)) {
      setNetworkFee(DEFAULT_NETWORK_FEE_STATE);
      return () => {
        cancelled = true;
      };
    }

    if (isSellAmountDebouncing) {
      setNetworkFee(ESTIMATING_NETWORK_FEE_STATE);
      return () => {
        cancelled = true;
      };
    }

    setNetworkFee(ESTIMATING_NETWORK_FEE_STATE);

    const estimateNetworkFee = async () => {
      try {
        const nextNetworkFee = isSolanaNetwork
          ? getSolanaNetworkFeeStateFromEstimate(
              await estimateSwapPoolSolNetworkFee({
                amountIn: derivedBurnAmount,
                poolDetail,
              }),
            )
          : getNetworkFeeStateFromEstimate(
              await estimateSwapPoolNetworkFee({
                poolAddress: poolDetail.pool.address,
                amountIn: derivedBurnAmount,
                decimals: poolDetail.pool.tokenInDecimals,
                tokenInAddress: poolDetail.pool.tokenIn,
              }),
            );

        if (!cancelled) {
          setNetworkFee(nextNetworkFee);
        }
      } catch (error: unknown) {
        if (cancelled) return;

        setNetworkFee(
          isSolanaNetwork
            ? getSolanaNetworkFeeStateFromError(error)
            : getEvmNetworkFeeStateFromError(error),
        );
      }
    };

    void estimateNetworkFee();

    return () => {
      cancelled = true;
    };
  }, [
    derivedBurnAmount,
    estimateSwapPoolNetworkFee,
    estimateSwapPoolSolNetworkFee,
    isSellAmountDebouncing,
    isSolanaNetwork,
    open,
    poolDetail,
  ]);

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
      refetchBurnBalance();
      refetchRewardBalance();
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      toast.error("Swap failed", {
        description: getErrorMessage({ error }),
      });
    }
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
                        className="flex min-h-full flex-col items-center justify-center gap-2 p-2 sm:p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) onOpenChange(false);
                        }}
                    >
                        <div
                            className={cn(
                                getVariantBorderClassName({ variant: "swap" }),
                                getVariantShadowClassName({ variant: "swap" }),
                                "h-fit w-full min-w-0 border-4 bg-mb-dark-popover px-4 py-4 sm:max-w-fit sm:px-6 sm:py-5 xl:px-8 xl:py-5",
                            )}
                        >
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold sm:text-2xl xl:text-40px">
                                    <p className="inline-flex items-center">
                                        <IconSwapCategory className="size-8 sm:size-10 xl:size-16" />
                                        TOKEN SWAP
                                    </p>
                                </DialogTitle>
                            </DialogHeader>

                            <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
                                <SellSection
                                    tokenDisplay={burnTokenDisplay}
                                    isLoadingWhitelistTokens={!poolDetail}
                                    register={register}
                                    errors={errors}
                                    onSelectPercent={handleSelectPercent}
                                    isLoadingBalance={isLoadingBurnBalance}
                                    balanceText={`${formatBalanceDisplay(burnBalanceFormatted.toUpperCase())} ${burnTokenDisplay?.symbol ?? ""}`}
                                    poolDetail={poolDetail}
                                    maxBurnLeft={maxBurnLeft}
                                    isExceedingMax={isExceedingMax}
                                    insufficientBalanceMessage={insufficientBalanceMessage}
                                    chainId={poolDetail?.pool.chainId}
                                />

                                <BuySection
                                    tokenDisplay={rewardTokenDisplay}
                                    isLoadingWhitelistTokens={!poolDetail}
                                    estimatedAmount={formattedEstimatedRewardAmount}
                                    isLoadingBalance={isLoadingRewardBalance}
                                    balanceText={`${formatBalanceDisplay(rewardBalanceFormatted)} ${rewardTokenDisplay?.symbol ?? ""}`}
                                    chainId={poolDetail?.pool.chainId}
                                />
                                <Button
                                    variant="swap"
                                    className="mt-4 w-full text-base md:text-xl 2xl:text-2xl"
                                    hasHover
                                    isLoading={isSubmitting}
                                    disabled={
                                        isSubmitting ||
                                        isSellAmountDebouncing ||
                                        isExceedingMax ||
                                        isInsufficientBalance
                                    }
                                    type="submit"
                                >
                                    {isSubmitting ? "Swapping..." : "Swap"}
                                </Button>

                                <SwapRateRow
                                    burnSymbol={burnTokenDisplay.symbol}
                                    rewardSymbol={rewardTokenDisplay.symbol}
                                    rewardNumerator={poolDetail?.pool?.rewardNumerator}
                                    rewardDenominator={poolDetail?.pool?.rewardDenominator}
                                    open={openFeePopUp}
                                    onToggle={() => setOpenFeePopUp(!openFeePopUp)}
                                />
                            </form>
                        </div>

                        <FeePanel
                            open={openFeePopUp}
                            networkFeeDisplay={networkFee.display}
                            networkFeeTooltip={networkFee.tooltip}
                            settlementFee={poolDetail?.pool?.settlementFee}
                        />
                    </div>
                </DialogBody>
            </DialogPortal>
        </Dialog>
    );
};

export default SwapDialog;
