import { toast } from "@/components/common/custom-toast";
import { Button } from "@/components/common/glow/button";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import InfoTooltip from "@/components/common/glow/info-tooltip";
import { Input } from "@/components/common/glow/input";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/common/glow/radio-group";
import WhitelistTokenSelect from "@/components/common/glow/whitelist-token-select";
import NetworkIcon from "@/components/layout/header/network-icon";
import {
  NETWORK_CONFIGS,
  networkIdToChainId,
  type NetworkId,
} from "@/config/networks";
import { cn } from "@/lib/utils";
import { pairConfigsService } from "@/services/pairConfigsService";
import { pairConfigsQueryKeys } from "@/services/queries/queryKey";
import { useSystemStore } from "@/stores/systemStore";
import { safeDecimalParse, shortenNumber } from "@/utils/helpers/numbers";
import { useCreateSwapPoolSolanaFn } from "@/views/swap-pool/create/useCreateSwapPoolSolanaFn";
import { useAppKitAccount } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useCreateSwapPoolEvmFn } from "../useCreateSwapPoolEvmFn";

type CreateSwapPoolFormValues = {
  poolName: string;
  tokenBurn: string;
  budget: string;
  tokenReward: string;
  amountPay: string; // This is only for the UI, not for the API, this is what client requested (MB-1054)
  numerator: string;
  denominator: string;
};

type Props = {
  onSubmitForm?: (values: CreateSwapPoolFormValues) => void;
  initialTokenBurn?: string;
  initialTokenReward?: string;
  initialBudget?: string;
};

const CreateSwapPoolForm = ({
  onSubmitForm,
  initialTokenBurn,
  initialTokenReward,
  initialBudget,
}: Props) => {
  const { caipAddress } = useAppKitAccount();
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";

  const navigate = useNavigate();
  const { createPool: createPoolSolana } = useCreateSwapPoolSolanaFn();
  const { createPool: createPoolEvm } = useCreateSwapPoolEvmFn();

  const network = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
    getFieldState,
    trigger,
  } = useForm<CreateSwapPoolFormValues>({
    defaultValues: {
      poolName: "",
      tokenBurn: undefined,
      tokenReward: undefined,
      budget: undefined,
      amountPay: undefined,
      numerator: "",
      denominator: "",
    },
    mode: "onChange",
  });

  const selectedTokenBurn = watch("tokenBurn");
  const selectedTokenReward = watch("tokenReward");
  const numerator = watch("numerator");
  const denominator = watch("denominator");
  const amountPay = watch("amountPay");

  const chainId = networkIdToChainId(selectedNetworkId);
  const shouldCheckMinRatio =
    !!chainId && !!selectedTokenBurn && !!selectedTokenReward;
  const {
    data: pairConfigData,
    isPending: isDetailPairConfigPending,
    isEnabled: isDetailPairConfigEnabled,
  } = useQuery({
    queryKey: pairConfigsQueryKeys.detail({
      chainId: chainId,
      tokenIn: selectedTokenBurn,
      tokenOut: selectedTokenReward,
    }),
    queryFn: async () => {
      return pairConfigsService.detailPairConfig({
        chainId: chainId!,
        tokenIn: selectedTokenBurn,
        tokenOut: selectedTokenReward,
      });
    },
    enabled: shouldCheckMinRatio,
    retry: false,
  });

  // Trigger denominator field check when any of these dependent fields change
  useEffect(() => {
    const denominatorFieldState = getFieldState("denominator");
    const isDenominatorDirty = denominatorFieldState?.isDirty;
    if (isDenominatorDirty) {
      trigger("denominator");
    }
  }, [
    pairConfigData,
    isDetailPairConfigEnabled,
    isDetailPairConfigPending,
    numerator,
  ]);

  const isRatioBiggerOrEqualToMinRatio = ({
    ratioNumerator,
    ratioDenominator,
    minRatioNumerator,
    minRatioDenominator,
  }: {
    ratioNumerator: string;
    ratioDenominator: string;
    minRatioNumerator: string;
    minRatioDenominator: string;
  }) => {
    const numberRatioNumerator = Number(ratioNumerator);
    const numberRatioDenominator = Number(ratioDenominator);
    const numberMinRatioNumerator = Number(minRatioNumerator);
    const numberMinRatioDenominator = Number(minRatioDenominator);

    if (
      !numberRatioNumerator ||
      !numberRatioDenominator ||
      !numberMinRatioNumerator ||
      !numberMinRatioDenominator
    ) {
      return true; // clear if a number is invalid
    }

    const ratio = numberRatioNumerator / numberRatioDenominator;
    const minRatio = numberMinRatioNumerator / numberMinRatioDenominator;
    return ratio >= minRatio;
  };

  // Reset form on network change
  useEffect(() => {
    reset();
  }, [selectedNetworkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill from navigation search params (once, on mount)
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    prefilledRef.current = true;
    if (initialTokenBurn)
      setValue("tokenBurn", initialTokenBurn, { shouldValidate: false });
    if (initialTokenReward)
      setValue("tokenReward", initialTokenReward, { shouldValidate: false });
    if (initialBudget)
      setValue("budget", initialBudget, { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit: SubmitHandler<CreateSwapPoolFormValues> = async (values) => {
    const ratioNumerator = Number(values.numerator || 0);
    const ratioDenominator = Number(values.denominator || 0);

    if (!ratioNumerator || !ratioDenominator) {
      toast.error("Invalid ratio format. Please use `X:Y`.");
      return;
    }
    if (!chainId) {
      toast.error("Invalid network configuration");
      return;
    }

    // Check min ratio again
    try {
      const pairConfigDetailData = await pairConfigsService.detailPairConfig({
        chainId: chainId!,
        tokenIn: values.tokenBurn,
        tokenOut: values.tokenReward,
      });
      if (pairConfigDetailData) {
        const isValidMinRatio = isRatioBiggerOrEqualToMinRatio({
          ratioNumerator: ratioNumerator.toString(),
          ratioDenominator: ratioDenominator.toString(),
          minRatioNumerator: pairConfigDetailData.pairConfig.ratioNumerator,
          minRatioDenominator: pairConfigDetailData.pairConfig.ratioDenominator,
        });
        if (!isValidMinRatio) {
          toast.error(
            `Ratio must be greater than or equal to min ratio (${pairConfigDetailData.pairConfig.ratioNumerator}:${pairConfigDetailData.pairConfig.ratioDenominator}, ${shortenNumber({ number: Number(pairConfigDetailData.pairConfig.ratio) })})`,
          );
          return;
        }
      }
    } catch (error) {
      // Error is most likely 404 due to min ratio config doesn't exist
      // In any case, ignore and let user proceed
      console.error(error);
    }

    if (isSolana && !onSubmitForm) {
      const poolAddress = await createPoolSolana({
        rewardMint: new PublicKey(values.tokenReward),
        depositMint: new PublicKey(values.tokenBurn),
        rewardAmount: Number(values.budget),
        name: values.poolName,
        ratioNumerator,
        ratioDenominator,
      });
      if (poolAddress) {
        reset();
        navigate({
          to: "/swap/detail/$address",
          params: { address: poolAddress },
        });
      }
      return;
    }

    if (isEvm && !onSubmitForm) {
      const poolAddress = await createPoolEvm({
        poolName: values.poolName,
        tokenReward: values.tokenReward,
        tokenIn: values.tokenBurn,
        rewardAmount: Number(values.budget),
        ratioNumerator,
        ratioDenominator,
      });
      if (poolAddress) {
        reset();
        navigate({
          to: "/swap/detail/$address",
          params: { address: poolAddress },
        });
      }
      return;
    }

    if (onSubmitForm) {
      onSubmitForm(values);
      reset();
      return;
    }

    console.log("Create swap pool form submitted", values);
  };

  const handleOnChangeBudget = (value: string) => {
    if (!!value && numerator && denominator) {
      const budgetNumber = Number(value);
      const numeratorNumber = Number(numerator);
      const denominatorNumber = Number(denominator);

      if (numeratorNumber && denominatorNumber && budgetNumber) {
        const numberAmountPay =
          (budgetNumber / denominatorNumber) * numeratorNumber;
        setValue("amountPay", Number(numberAmountPay.toFixed(6)).toString(), {
          shouldValidate: true,
        });
      }
    }
  };

  const handleOnChangeNumerator = (value: string) => {
    const numeratorNumber = Number(value);
    const denominatorNumber = Number(denominator);
    const amountPayNumber = Number(amountPay);

    if (numeratorNumber && denominatorNumber && amountPayNumber) {
      const numberBudget =
        (amountPayNumber / numeratorNumber) * denominatorNumber;
      setValue("budget", Number(numberBudget.toFixed(6)).toString(), {
        shouldValidate: true,
      });
    }
  };

  const handleOnChangeDenominator = (value: string) => {
    const numeratorNumber = Number(numerator);
    const denominatorNumber = Number(value);
    const amountPayNumber = Number(amountPay);

    if (numeratorNumber && denominatorNumber && amountPayNumber) {
      const numberBudget =
        (amountPayNumber / numeratorNumber) * denominatorNumber;
      setValue("budget", Number(numberBudget.toFixed(6)).toString(), {
        shouldValidate: true,
      });
    }
  };

  const handleOnChangeAmountPay = (value: string) => {
    if (!!value && numerator && denominator) {
      const amountPayNumber = Number(value);
      const numeratorNumber = Number(numerator);
      const denominatorNumber = Number(denominator);

      if (numeratorNumber && denominatorNumber && amountPayNumber) {
        const numberBudget =
          (amountPayNumber / numeratorNumber) * denominatorNumber;
        setValue("budget", Number(numberBudget.toFixed(6)).toString(), {
          shouldValidate: true,
        });
      }
    }
  };

  return (
    <form
      className="w-full space-y-4 font-inter md:max-w-lg md:space-y-6 lg:max-w-xl lg:space-y-8 xl:max-w-2xl xl:space-y-12 2xl:space-y-15"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Enter pool name"
          aria-invalid={!!errors.poolName}
          variant="swap"
          className={cn(
            getVariantBgClassName({
              variant: "swap",
            }),
            "border-2 pl-3 text-xs font-medium sm:text-sm md:pl-4 md:text-base lg:text-lg xl:text-xl 2xl:text-23px",
          )}
          {...register("poolName", {
            validate: {
              required: (poolName) => {
                const trimmedPoolName = poolName.trim();
                return trimmedPoolName.length === 0
                  ? "Pool name is required"
                  : true;
              },
              minLength: (poolName) => {
                const trimmedPoolName = poolName.trim();
                return trimmedPoolName.length >= 3
                  ? true
                  : "Pool name must be at least 3 characters";
              },
              maxLength: (poolName) => {
                const trimmedPoolName = poolName.trim();
                return trimmedPoolName.length <= 30
                  ? true
                  : "Pool name must be at most 30 characters";
              },
            },
          })}
        />
        {errors.poolName && (
          <p className="font-inter text-xs text-destructive">
            {errors.poolName.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
          Pool Info
        </span>
        <div className="flex">
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              Token Swap
            </span>
            <WhitelistTokenSelect
              variant="swap"
              value={selectedTokenBurn}
              onChange={(token) =>
                setValue("tokenBurn", token?.address, { shouldValidate: true })
              }
              disabledAddress={selectedTokenReward}
              classNames={{
                trigger: cn(
                  "w-full px-2 py-1 text-xs font-medium sm:text-sm md:px-3 md:py-1.5 md:text-base lg:max-w-2/3 lg:text-lg xl:text-xl 2xl:px-4 2xl:text-23px",
                  getVariantBorderClassName({
                    variant: "swap",
                    custom: "rounded-md",
                  }),
                ),
                triggerContent:
                  "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px font-medium",
                // icon: "size-3.5 md:size-4 lg:size-5",
              }}
            />
            <input
              type="hidden"
              {...register("tokenBurn", { required: "Token swap is required" })}
            />
            {errors.tokenBurn && (
              <p className="font-inter text-xs text-destructive">
                {errors.tokenBurn.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
            Ratio{" "}
            <InfoTooltip
              variant="swap"
              classNames={{
                icon: "size-3.5 text-xs",
                contentContainer: "max-h-fit",
                textContainer: "min-h-10 font-inter",
              }}
              side="right"
              content="Token swap : token reward"
            />
          </span>
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="numerator"
              rules={{
                required: "Numerator is required",
                validate: {
                  validNumber: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isFinite()
                      ? true
                      : "Numerator must be a valid number";
                  },
                  moreThanZero: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isZero()
                      ? "Numerator must be greater than zero"
                      : true;
                  },
                  notNegative: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isNegative()
                      ? "Numerator must be positive"
                      : true;
                  },
                  mustBeInteger: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal && decimal.decimalPlaces() > 0
                      ? "Numerator must be an integer"
                      : true;
                  },
                },
              }}
              render={({ field: { onChange, value, ref, name, onBlur } }) => (
                <NumericInput
                  inputComponent={Input}
                  variant="swap"
                  placeholder="1"
                  aria-invalid={!!errors.numerator}
                  className={cn(
                    "w-20 border-2 bg-transparent py-1 pl-3 text-xs font-medium sm:text-sm md:w-30 md:py-1.5 md:pl-4 md:text-base lg:text-lg xl:text-xl 2xl:max-w-76 2xl:text-23px",
                  )}
                  value={value ?? ""}
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  onChange={(val) => {
                    onChange(val);
                    handleOnChangeNumerator(val);
                  }}
                />
              )}
            />
            <div className="h-full align-middle">:</div>
            <Controller
              control={control}
              name="denominator"
              rules={{
                required: "Denominator is required",
                validate: {
                  validNumber: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isFinite()
                      ? true
                      : "Denominator must be a valid number";
                  },
                  moreThanZero: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isZero()
                      ? "Denominator must be greater than zero"
                      : true;
                  },
                  notNegative: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isNegative()
                      ? "Denominator must be positive"
                      : true;
                  },
                  mustBeInteger: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal && decimal.decimalPlaces() > 0
                      ? "Denominator must be an integer"
                      : true;
                  },
                  minRatio: (value) => {
                    if (
                      isDetailPairConfigEnabled &&
                      !isDetailPairConfigPending &&
                      pairConfigData
                    ) {
                      const isValidMinRatio = isRatioBiggerOrEqualToMinRatio({
                        ratioNumerator: numerator,
                        ratioDenominator: value,
                        minRatioNumerator:
                          pairConfigData.pairConfig.ratioNumerator,
                        minRatioDenominator:
                          pairConfigData.pairConfig.ratioDenominator,
                      });

                      if (!isValidMinRatio) {
                        return `Ratio must be greater than or equal to min ratio (${pairConfigData.pairConfig.ratioNumerator}:${pairConfigData.pairConfig.ratioDenominator}, ${shortenNumber({ number: Number(pairConfigData.pairConfig.ratio) })})`;
                      }
                    }

                    return true;
                  },
                },
              }}
              render={({ field: { onChange, value, ref, name, onBlur } }) => (
                <NumericInput
                  inputComponent={Input}
                  variant="swap"
                  placeholder="1"
                  aria-invalid={!!errors.denominator}
                  className={cn(
                    "w-20 border-2 bg-transparent py-1 pl-3 text-xs font-medium sm:text-sm md:w-30 md:py-1.5 md:pl-4 md:text-base lg:text-lg xl:text-xl 2xl:max-w-76 2xl:text-23px",
                  )}
                  value={value ?? ""}
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  onChange={(val) => {
                    onChange(val);
                    handleOnChangeDenominator(val);
                  }}
                />
              )}
            />
            <RadioGroup variant="swap" value="fixed" asChild>
              <RadioGroupItem
                value="fixed"
                className={cn(
                  getVariantBorderClassName({
                    variant: "swap",
                    custom: "rounded-md border-2",
                  }),
                  getVariantBgClassName({ variant: "swap" }),
                  "px-2 py-1 text-xs sm:text-sm md:px-3 md:py-1.5 md:text-base lg:text-lg xl:text-xl 2xl:px-4 2xl:text-23px",
                )}
              >
                Fixed
              </RadioGroupItem>
            </RadioGroup>
          </div>
          {errors.numerator && (
            <p className="font-inter text-xs text-destructive">
              {errors.numerator.message}
            </p>
          )}
          {errors.denominator && (
            <p className="font-inter text-xs text-destructive">
              {errors.denominator.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
            You Pay
          </span>
          <Controller
            control={control}
            name="amountPay"
            rules={{
              required: "Amount pay is required",
              validate: {
                validNumber: (value) => {
                  const decimal = safeDecimalParse({ value: value ?? "" });
                  return decimal?.isFinite()
                    ? true
                    : "Amount pay must be a valid number";
                },
                moreThanZero: (value) => {
                  const decimal = safeDecimalParse({ value: value ?? "" });
                  return decimal?.isZero()
                    ? "Amount pay must be greater than zero"
                    : true;
                },
                notNegative: (value) => {
                  const decimal = safeDecimalParse({ value: value ?? "" });
                  return decimal?.isNegative()
                    ? "Amount pay must be positive"
                    : true;
                },
                maxDecimals: (value) => {
                  const decimal = safeDecimalParse({ value: value ?? "" });
                  return decimal && decimal.decimalPlaces() <= 6
                    ? true
                    : "Amount pay must have 6 decimals or less";
                },
              },
            }}
            render={({ field: { onChange, value, ref, name, onBlur } }) => (
              <NumericInput
                inputComponent={Input}
                variant="swap"
                placeholder="0.0"
                aria-invalid={!!errors.amountPay}
                className={cn(
                  "w-full border-2 bg-transparent py-1 pl-3 text-xs font-medium sm:text-sm md:max-w-60 md:py-1.5 md:pl-4 md:text-base lg:text-lg xl:text-xl 2xl:max-w-76 2xl:text-23px",
                )}
                value={value ?? ""}
                ref={ref}
                name={name}
                onBlur={onBlur}
                onChange={(val) => {
                  onChange(val);
                  handleOnChangeAmountPay(val);
                }}
              />
            )}
          />
          {errors.amountPay && (
            <p className="font-inter text-xs text-destructive">
              {errors.amountPay.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
          Reward Config
        </span>
        <div className="flex">
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              Token Receive
            </span>
            <WhitelistTokenSelect
              value={selectedTokenReward}
              onChange={(token) =>
                setValue("tokenReward", token?.address, {
                  shouldValidate: true,
                })
              }
              disabledAddress={selectedTokenBurn}
              classNames={{
                trigger: cn(
                  "w-full px-2 py-1 text-xs font-medium sm:text-sm md:px-3 md:py-1.5 md:text-base lg:max-w-2/3 lg:text-lg xl:text-xl 2xl:px-4 2xl:text-23px",
                  getVariantBorderClassName({
                    variant: "swap",
                    custom: "rounded-md",
                  }),
                ),
                triggerContent:
                  "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px font-medium",
                // icon: "size-3.5 md:size-4 lg:size-5",
              }}
            />
            <input
              type="hidden"
              {...register("tokenReward", {
                required: "Reward token is required",
              })}
            />
            {errors.tokenReward && (
              <p className="font-inter text-xs text-destructive">
                {errors.tokenReward.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:grid md:grid-cols-2 md:gap-6">
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              Network
            </span>
            <div
              className={cn(
                getVariantBorderClassName({ variant: "swap" }),
                "relative flex items-center gap-2 px-3 py-1 text-xs text-nowrap sm:text-sm md:px-4 md:py-1.5 md:text-base lg:text-lg xl:text-xl 2xl:text-23px",
                "rounded-md border-2",
              )}
            >
              <NetworkIcon
                networkId={network?.id || ("" as NetworkId)}
                className="size-3.5 md:size-4 2xl:size-5.75"
              />
              <span>{network?.label}</span>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              You Receive
            </span>
            <Controller
              control={control}
              name="budget"
              rules={{
                required: "Budget is required",
                validate: {
                  validNumber: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isFinite()
                      ? true
                      : "Budget must be a valid number";
                  },
                  moreThanZero: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isZero()
                      ? "Budget must be greater than zero"
                      : true;
                  },
                  notNegative: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal?.isNegative()
                      ? "Budget must be positive"
                      : true;
                  },
                  maxDecimals: (value) => {
                    const decimal = safeDecimalParse({ value: value ?? "" });
                    return decimal && decimal.decimalPlaces() <= 6
                      ? true
                      : "Budget must have 6 decimals or less";
                  },
                },
              }}
              render={({ field: { onChange, value, ref, name, onBlur } }) => (
                <NumericInput
                  inputComponent={Input}
                  variant="swap"
                  placeholder="0.0"
                  aria-invalid={!!errors.budget}
                  className={cn(
                    "w-full border-2 bg-transparent py-1 pl-3 text-xs font-medium sm:text-sm md:py-1.5 md:pl-4 md:text-base lg:text-lg xl:text-xl 2xl:max-w-76 2xl:text-23px",
                  )}
                  value={value ?? ""}
                  ref={ref}
                  name={name}
                  onBlur={onBlur}
                  onChange={(val) => {
                    onChange(val);
                    handleOnChangeBudget(val);
                  }}
                />
              )}
            />
            {errors.budget && (
              <p className="font-inter text-xs text-destructive">
                {errors.budget.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="swap"
          type="submit"
          hasHover
          isLoading={isSubmitting}
          className="w-full text-center font-orbitron text-sm font-semibold md:w-64 md:text-base lg:w-72 lg:text-xl 2xl:w-76.25 2xl:text-2xl"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default CreateSwapPoolForm;
