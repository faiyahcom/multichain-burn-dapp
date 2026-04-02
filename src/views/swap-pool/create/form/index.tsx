import { useAppKitAccount } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useCreateSwapPoolSolanaFn } from "@/views/swap-pool/create/useCreateSwapPoolSolanaFn";
import { useCreateSwapPoolEvmFn } from "../useCreateSwapPoolEvmFn";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { toast } from "@/components/common/custom-toast";
import WhitelistTokenSelect from "@/components/common/glow/whitelist-token-select";
import NetworkIcon from "@/components/layout/header/network-icon";
import { safeDecimalParse } from "@/utils/helpers/numbers";
import { DEFAULT_INPUT_NUMBER_STEP } from "@/config/constant";
import { cn } from "@/lib/utils";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import InfoTooltip from "@/components/common/glow/info-tooltip";
import { Button } from "@/components/common/glow/button";
import { Input } from "@/components/common/glow/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/common/glow/radio-group";

type CreateSwapPoolFormValues = {
  poolName: string;
  tokenBurn: string;
  ratio: string;
  budget: string;
  tokenReward: string;
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
    formState: { errors, isSubmitting },
  } = useForm<CreateSwapPoolFormValues>({
    defaultValues: {
      poolName: "",
      tokenBurn: undefined,
      ratio: undefined,
      tokenReward: undefined,
      budget: undefined,
    },
  });

  const selectedTokenBurn = watch("tokenBurn");
  const selectedTokenReward = watch("tokenReward");

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
    const [rawNumerator, rawDenominator] = values.ratio
      .split(":")
      .map((v) => v.trim());
    const ratioNumerator = Number(rawNumerator || 0);
    const ratioDenominator = Number(rawDenominator || 0);

    if (!ratioNumerator || !ratioDenominator) {
      toast.error("Invalid ratio format. Please use `X:Y`.");
      return;
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

  return (
    <form
      className="w-full max-w-2xl space-y-15 font-inter"
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
            "border-2 text-[23px] font-medium pl-4",
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
          <p className="text-xs text-destructive">{errors.poolName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-3xl font-medium">Pool Info</span>
        <div className="flex justify-between gap-6">
          <div className="flex w-md flex-col gap-2">
            <span className="text-[23px]">Token Burn</span>
            <WhitelistTokenSelect
              variant="swap"
              value={selectedTokenBurn}
              onChange={(token) =>
                setValue("tokenBurn", token?.address, { shouldValidate: true })
              }
              disabledAddress={selectedTokenReward}
              classNames={{
                trigger: cn(
                  "px-4 py-2 text-[23px] font-medium",
                  getVariantBorderClassName({ variant: "swap" }),
                ),
                triggerContent: "text-[23px] font-medium",
                icon: "size-5",
              }}
            />
            <input
              type="hidden"
              {...register("tokenBurn", { required: "Token burn is required" })}
            />
            {errors.tokenBurn && (
              <p className="text-xs text-destructive">
                {errors.tokenBurn.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[23px]">
            Ratio{" "}
            <InfoTooltip
              variant="swap"
              classNames={{
                icon: "size-3.5 text-xs",
                contentContainer: "max-h-fit",
                textContainer: "min-h-10 font-inter",
              }}
              side="right"
              content="Token burn : token reward"
            />
          </span>
          <div className="flex items-center gap-3">
            <Input
              placeholder="1:1"
              aria-invalid={!!errors.ratio}
              variant="swap"
              className={cn(
                "border-2 py-1.5 text-[23px] font-medium",
                "w-20 bg-transparent px-2 text-center placeholder:text-center",
              )}
              {...register("ratio", {
                required: "Ratio is required",
                validate: (value) => {
                  const trimmed = value.trim();

                  // allow negative/decimal numbers through format check
                  const match = trimmed.match(/^(-?[\d.]+):(-?[\d.]+)$/);
                  if (!match) return 'Ratio must be in format "X:Y" (e.g. 1:2)';

                  const left = Number(match[1]);
                  const right = Number(match[2]);

                  if (!Number.isInteger(left) || !Number.isInteger(right))
                    return "Both numbers must be integers";
                  if (left <= 0 || right <= 0)
                    return "Both numbers must be greater than zero";

                  return true;
                },
              })}
            />
            <RadioGroup value="fixed" asChild>
              <RadioGroupItem
                value="fixed"
                className={cn(
                  getVariantBorderClassName({
                    variant: "swap",
                    custom: "rounded-md border-2",
                  }),
                  getVariantBgClassName({ variant: "swap" }),
                  "px-3 py-2",
                )}
              >
                <span>Fixed</span>
              </RadioGroupItem>
            </RadioGroup>
          </div>
          {errors.ratio && (
            <p className="text-xs text-destructive">{errors.ratio.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-3xl font-medium">Reward Config</span>
        <div className="flex justify-between gap-6">
          <div className="flex w-md flex-col gap-2">
            <span className="text-[23px]">Token Reward</span>
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
                  "px-4 py-2 text-[23px] font-medium",
                  getVariantBorderClassName({ variant: "swap" }),
                ),
                triggerContent: "text-[23px] font-medium",
                icon: "size-5",
              }}
            />
            <input
              type="hidden"
              {...register("tokenReward", {
                required: "Reward token is required",
              })}
            />
            {errors.tokenReward && (
              <p className="text-xs text-destructive">
                {errors.tokenReward.message}
              </p>
            )}
          </div>
        </div>

        <span className="text-[23px]">Budget</span>
        <Input
          variant="swap"
          placeholder="0.0"
          aria-invalid={!!errors.budget}
          className={cn(
            "max-w-40 border-2 bg-transparent py-1.5 pl-4 text-[23px] font-medium",
          )}
          type="number"
          step={DEFAULT_INPUT_NUMBER_STEP} // allow up to 6 decimals
          {...register("budget", {
            required: "Budget is required",
            validate: {
              validNumber: (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal?.isFinite()
                  ? true
                  : "Budget must be a valid number";
              },
              moreThanZero: (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal?.isZero()
                  ? "Budget must be greater than zero"
                  : true;
              },
              notNegative: (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal?.isNegative() ? "Budget must be positive" : true;
              },
              maxDecimals: (value) => {
                const decimal = safeDecimalParse({ value });
                return decimal && decimal.decimalPlaces() <= 6
                  ? true
                  : "Budget must have 6 decimals or less";
              },
            },
          })}
        />
        {errors.budget && (
          <p className="text-xs text-destructive">{errors.budget.message}</p>
        )}

        <div className="flex gap-3.75">
          <div className="flex flex-col justify-end gap-2">
            <span className="text-3xl font-medium">Network</span>
            <div
              className={cn(
                getVariantBorderClassName({ variant: "swap" }),
                "relative flex gap-2 px-14 py-2 text-[23px] text-nowrap",
                "rounded-md border-2",
              )}
            >
              <NetworkIcon
                networkId={network?.id || ("" as NetworkId)}
                className="absolute left-4 size-5.75"
              />
              <span>{network?.label}</span>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-2">
            <span className="text-[23px]">Burn Method</span>
            <span
              className={cn(
                getVariantBorderClassName({ variant: "swap" }),
                "relative flex gap-2 px-14 py-2 text-[23px] text-nowrap",
                "rounded-md border-2",
              )}
            >
              Transfer to Maker
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="swap"
          type="submit"
          hasHover
          isLoading={isSubmitting}
          className="w-76.25 text-center font-orbitron text-2xl font-semibold"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default CreateSwapPoolForm;
