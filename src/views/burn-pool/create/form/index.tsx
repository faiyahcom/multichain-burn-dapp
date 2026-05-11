import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useCreateBurnPoolEvmFn } from "../useCreateBurnPoolEvmFn";
import { useCreateBurnPoolSolFn } from "../useCreateBurnPoolSolFn";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import NetworkIcon from "@/components/layout/header/network-icon";
import WhitelistTokenSelect from "@/components/common/glow/whitelist-token-select";
import { cn } from "@/lib/utils";
import {
  getVariantBgClassName,
  getVariantBorderClassName,
} from "@/components/common/glow/container";
import { Button } from "@/components/common/glow/button";
import { Input } from "@/components/common/glow/input";
import { DatePicker } from "@/components/common/glow/date-picker";

type CreateSwapPoolFormValues = {
  poolName: string;
  tokenBurn: string;
  tokenReward: string;
  startTime: Date;
  endTime: Date;
};

type Props = {
  onSubmitForm?: (values: CreateSwapPoolFormValues) => void;
};

const CreateBurnPoolForm = ({ onSubmitForm }: Props) => {
  const { caipAddress } = useAppKitAccount();
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";

  const navigate = useNavigate();
  const { createPool: createPoolSol } = useCreateBurnPoolSolFn();
  const { createPool: createPoolEvm } = useCreateBurnPoolEvmFn();

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
      poolName: undefined,
      tokenBurn: undefined,
      tokenReward: undefined,
      startTime: undefined,
      endTime: undefined,
    },
  });

  const selectedTokenBurn = watch("tokenBurn");
  const selectedTokenReward = watch("tokenReward");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // Reset form on network change
  useEffect(() => {
    reset();
  }, [selectedNetworkId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit: SubmitHandler<CreateSwapPoolFormValues> = async (values) => {
    if (isSolana && !onSubmitForm) {
      const poolAddress = await createPoolSol({
        poolName: values.poolName,
        tokenBurn: values.tokenBurn,
        tokenReward: values.tokenReward,
        startTime: values.startTime,
        endTime: values.endTime,
      });
      if (poolAddress) {
        reset();
        navigate({
          to: "/burn/detail/$address",
          params: { address: poolAddress },
          search: { depositReward: true },
        });
      }
      return;
    }

    if (isEvm && !onSubmitForm) {
      const poolAddress = await createPoolEvm({
        poolName: values.poolName,
        tokenBurn: values.tokenBurn,
        tokenReward: values.tokenReward,
        startTime: values.startTime,
        endTime: values.endTime,
      });
      if (poolAddress) {
        reset();
        navigate({
          to: "/burn/detail/$address",
          params: { address: poolAddress },
          search: { depositReward: true },
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
      className="w-full space-y-4 font-inter md:max-w-lg md:space-y-6 lg:max-w-xl lg:space-y-8 xl:max-w-2xl xl:space-y-12 2xl:space-y-15"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Enter pool name"
          aria-invalid={!!errors.poolName}
          variant="burn"
          className={cn(
            getVariantBgClassName({ variant: "burn" }),
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
              Token Burn
            </span>
            <WhitelistTokenSelect
              variant="burn"
              value={selectedTokenBurn}
              onChange={(token) =>
                setValue("tokenBurn", token?.address, { shouldValidate: true })
              }
              disabledAddress={selectedTokenReward}
              classNames={{
                trigger: cn(
                  "w-full px-2 py-1 text-xs font-medium sm:text-sm md:px-3 md:py-1.5 md:text-base lg:max-w-2/3 lg:text-lg xl:text-xl 2xl:px-4 2xl:text-23px",
                  getVariantBorderClassName({
                    variant: "burn",
                    custom: "rounded-md",
                  }),
                ),
                triggerContent:
                  "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px font-medium",
              }}
            />
            <input
              type="hidden"
              {...register("tokenBurn", { required: "Token burn is required" })}
            />
            {errors.tokenBurn && (
              <p className="font-inter text-xs text-destructive">
                {errors.tokenBurn.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 md:grid md:grid-cols-2 md:gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              Start Time
            </span>
            <DatePicker
              variant="burn"
              value={startTime}
              onChange={(date: Date | undefined) =>
                setValue("startTime", date as Date, { shouldValidate: true })
              }
              className="rounded-md px-2 py-3 text-xs sm:text-sm md:px-3 md:py-5 md:text-base lg:text-lg xl:text-xl 2xl:text-23px"
              disabled={(date: Date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || (endTime ? date > endTime : false);
              }}
            />
            <input
              type="hidden"
              {...register("startTime", {
                required: "Start time is required",
                validate: (value) => {
                  if (value <= new Date())
                    return "Start time must be in the future";
                  if (endTime && value >= endTime)
                    return "Start time must be before end time";
                  return true;
                },
              })}
            />
            {errors.startTime && (
              <p className="font-inter text-xs text-destructive">
                {errors.startTime.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              End Time
            </span>
            <DatePicker
              variant="burn"
              value={endTime}
              onChange={(date: Date | undefined) =>
                setValue("endTime", date as Date, { shouldValidate: true })
              }
              className="rounded-md px-2 py-0 text-xs sm:text-sm md:px-3 md:py-5 md:text-base lg:text-lg xl:text-xl 2xl:text-23px"
              disabled={(date: Date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today || (startTime ? date < startTime : false);
              }}
            />
            <input
              type="hidden"
              {...register("endTime", {
                required: "End time is required",
                validate: (value) => {
                  if (value <= new Date())
                    return "End time must be in the future";
                  if (startTime && value <= startTime)
                    return "End time must be after start time";
                  return true;
                },
              })}
            />
            {errors.endTime && (
              <p className="font-inter text-xs text-destructive">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
          Reward Config
        </span>
        <div className="flex">
          <div className="flex w-full flex-col gap-2">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px">
              Token Reward
            </span>
            <WhitelistTokenSelect
              variant="burn"
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
                    variant: "burn",
                    custom: "rounded-md",
                  }),
                ),
                triggerContent:
                  "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-23px font-medium",
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
          <div className="flex w-full flex-col justify-end gap-2">
            <span className="text-sm font-medium sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl">
              Network
            </span>
            <div
              className={cn(
                getVariantBorderClassName({ variant: "burn" }),
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
              Burn Method
            </span>
            <span
              className={cn(
                getVariantBorderClassName({ variant: "burn" }),
                "relative flex gap-2 px-3 py-1 text-xs text-nowrap sm:text-sm md:px-4 md:py-1.5 md:text-base lg:text-lg xl:text-xl 2xl:px-8 2xl:text-23px",
                "rounded-md border-2",
              )}
            >
              Burn
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="burn"
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

export default CreateBurnPoolForm;
