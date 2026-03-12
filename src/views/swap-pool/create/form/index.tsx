import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppKitAccount } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useCreateSwapPoolSolanaFn } from "@/views/swap-pool/create/useCreateSwapPoolSolanaFn";
import { useCreateSwapPoolEvmFn } from "../useCreateSwapPoolEvmFn";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { toast } from "@/components/common/custom-toast";
import AnimateIconButton from "@/components/common/animate-icon-button";
import WhitelistTokenSelect from "@/components/common/whitelist-token-select";
import InfoTooltip from "@/components/common/info-tooltip";
import NetworkIcon from "@/components/layout/header/network-icon";

type CreateSwapPoolFormValues = {
  poolName: string;
  tokenBurn: string;
  ratio: string;
  budget: string;
  tokenReward: string;
};

type Props = {
  onSubmitForm?: (values: CreateSwapPoolFormValues) => void;
};

const CreateSwapPoolForm = ({ onSubmitForm }: Props) => {
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
      poolName: undefined,
      tokenBurn: undefined,
      ratio: undefined,
      tokenReward: undefined,
      budget: undefined,
    },
  });

  const selectedTokenBurn = watch("tokenBurn");
  const selectedTokenReward = watch("tokenReward");

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

        <div className="flex flex-col gap-2">
          <span className="text-[13px]">
            Ratio{" "}
            <InfoTooltip
              classNames={{
                icon: "size-3.5 text-xs",
                contentContainer: "max-h-fit",
                textContainer: "min-h-10",
              }}
              side="right"
              content="Token burn : token reward"
            />
          </span>
          <div className="flex items-center gap-3">
            <Input
              placeholder="1:1"
              aria-invalid={!!errors.ratio}
              {...register("ratio", { required: "Ratio is required" })}
              className="w-20 px-2 text-center placeholder:text-center"
            />
            <RadioGroup value="fixed" className="flex items-center gap-2">
              <RadioGroupItem value="fixed">
                <span>Fixed</span>
              </RadioGroupItem>
            </RadioGroup>
          </div>
          {errors.ratio && (
            <p className="text-xs text-destructive">{errors.ratio.message}</p>
          )}
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

          <span className="text-[13px]">Budget</span>
          <Input
            placeholder="0.0"
            aria-invalid={!!errors.budget}
            {...register("budget", { required: "Budget is required" })}
            className="w-full max-w-40"
          />
          {errors.budget && (
            <p className="text-xs text-destructive">{errors.budget.message}</p>
          )}

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
                Transfer to Maker
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

export default CreateSwapPoolForm;
