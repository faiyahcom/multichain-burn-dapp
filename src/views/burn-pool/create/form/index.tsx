import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppKitAccount } from "@reown/appkit/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useCreateBurnPoolEvmFn } from "../useCreateBurnPoolEvmFn";
import { useCreateBurnPoolSolFn } from "../useCreateBurnPoolSolFn";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import AnimateIconButton from "@/components/common/animate-icon-button";
import WhitelistTokenSelect from "@/components/common/whitelist-token-select";
import { DatePicker } from "@/components/ui/date-picker";
import NetworkIcon from "@/components/layout/header/network-icon";

type CreateSwapPoolFormValues = {
  poolName: string;
  tokenBurn: string;
  ratio: string;
  budget: string;
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
      className="w-full max-w-xl space-y-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-8 flex flex-col gap-2">
        <Input
          placeholder="Enter Pool Name"
          aria-invalid={!!errors.poolName}
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

      <div className="flex flex-col gap-2">
        <span className="text-xl font-medium">Pool Info</span>
        <div className="flex justify-between gap-6">
          <div className="flex w-md flex-col gap-2">
            <span className="text-[13px]">Token Burn</span>
            <WhitelistTokenSelect
              value={selectedTokenBurn}
              onChange={(address) =>
                setValue("tokenBurn", address, { shouldValidate: true })
              }
              disabledAddress={selectedTokenReward}
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

        <div className="flex gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[13px]">Start Time</span>
            <DatePicker
              value={startTime}
              onChange={(date) =>
                setValue("startTime", date as Date, { shouldValidate: true })
              }
              disabled={(date) => {
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
              <p className="text-xs text-destructive">
                {errors.startTime.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px]">End Time</span>
            <DatePicker
              value={endTime}
              onChange={(date) =>
                setValue("endTime", date as Date, { shouldValidate: true })
              }
              disabled={(date) => {
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
              <p className="text-xs text-destructive">
                {errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px]">Ratio</span>
          <RadioGroup value="dynamic" className="m-0 flex items-center p-0">
            <RadioGroupItem value="dynamic">
              <span className="text-[13px] font-normal">Dynamic</span>
            </RadioGroupItem>
          </RadioGroup>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xl font-medium">Reward Config</span>
          <div className="flex justify-between gap-6">
            <div className="flex w-md flex-col gap-2">
              <span className="text-[13px]">Token Reward</span>
              <WhitelistTokenSelect
                value={selectedTokenReward}
                onChange={(address) =>
                  setValue("tokenReward", address, { shouldValidate: true })
                }
                disabledAddress={selectedTokenBurn}
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

          {/* <span className="text-[13px]">Budget</span>
                    <Input
                        placeholder="0.0"
                        aria-invalid={!!errors.budget}
                        {...register("budget", { required: "Budget is required" })}
                        className="w-full max-w-40"
                    />
                    {errors.budget && (
                        <p className="text-xs text-destructive">{errors.budget.message}</p>
                    )} */}

          <div className="flex items-end gap-10">
            <span className="text-xl font-medium">Network</span>
            <div className="relative flex gap-2 rounded-md-plus bg-inactive px-14 py-1 text-[15px] text-nowrap">
              <NetworkIcon
                networkId={network?.id || ("" as NetworkId)}
                className="absolute left-4"
              />
              <span>{network?.label}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px]">Burn Method</span>
              <span className="flex gap-2 rounded-md-plus bg-inactive px-14 py-1 text-[15px] text-nowrap">
                Burn
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <AnimateIconButton
            iconLetter="S"
            text="Submit"
            variant="letter-icon"
            textVariant="text-container-center"
            classNames={{
              btn: "w-76.25 text-center after:text-white after:text-xl after:font-semibold after:bg-active",
              text: "text-xl font-medium",
              icon: "size-8 text-xl",
            }}
            color="#966EFF"
            isLoading={isSubmitting}
            isLoadingText="Submitting..."
            btnProps={{
              type: "submit",
              disabled: isSubmitting,
            }}
          />
        </div>
      </div>
    </form>
  );
};

export default CreateBurnPoolForm;
