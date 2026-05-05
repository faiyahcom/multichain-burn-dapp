import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { useAppKitAccount } from "@reown/appkit/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import AnimateIconButton from "@/components/common/animate-icon-button";
import WhitelistTokenSelect from "@/components/common/whitelist-token-select";
import { DatePicker } from "@/components/ui/date-picker";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { useCreateStakePoolSolFn } from "../useCreateStakePoolSolFn";
import { useCreateStakePoolEvmFn } from "../useCreateStakePoolEvmFn";
import NetworkIcon from "@/components/layout/header/network-icon";
import { useGetWhitelistTokens } from "@/services/queries/queries";
import { WSOL_ADDRESS, ZERO_ADDRESS } from "@/config/constant";
import { useNavigate } from "@tanstack/react-router";
import BlueSwitch from "@/components/common/blue-switch";
import InfoTooltip from "@/components/common/info-tooltip";

type CreateStakePoolFormValues = {
  poolName: string;
  startTime: Date;
  endTime: Date;
  stakingToken: string;
  minStakingAmount: string;
  maxStakingAmount: string;
  stakingLimit: string;
  rewardToken: string;
  lockDuration: string;
  interestStartDelay: string;
  interestAccrualDuration: string;
  claimStartDelay: string;
  apr: string;
  lowRewardNotification: boolean;
  stopAccrualAtPoolEnd: boolean;
  budget: string;
};

export const MIN_DAYS = import.meta.env.VITE_ENV === "development" ? 0 : 1;

const CreateStakePoolForm = () => {
  const navigate = useNavigate();
  const { caipAddress } = useAppKitAccount();
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";

  const { createPool: createPoolSol, submitPool: submitPoolSol } =
    useCreateStakePoolSolFn();
  const { createPool: createPoolEvm } = useCreateStakePoolEvmFn();
  const submitActionRef = useRef<"draft" | "submit">("draft");
  const inFlightRef = useRef(false);
  const submitAttemptedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateStakePoolFormValues>({
    mode: "onChange",
    defaultValues: {
      poolName: "",
      startTime: undefined,
      endTime: undefined,
      stakingToken: "",
      minStakingAmount: "",
      maxStakingAmount: "",
      stakingLimit: "",
      rewardToken: "",
      lockDuration: "",
      interestStartDelay: "",
      interestAccrualDuration: "",
      claimStartDelay: "",
      apr: "",
      lowRewardNotification: true,
      stopAccrualAtPoolEnd: true,
      budget: "",
    },
  });

  const stakingToken = watch("stakingToken");
  const rewardToken = watch("rewardToken");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const stakingLimitVal = watch("stakingLimit");
  const aprVal = watch("apr");
  const interestDurationVal = watch("interestAccrualDuration");
  const stopAccrualAtPoolEnd = watch("stopAccrualAtPoolEnd");

  const maxRewardEnabled =
    Number(stakingLimitVal) > 0 &&
    Number(aprVal) > 0 &&
    Number(interestDurationVal) > 0;
  const maxRewardDisplay = maxRewardEnabled
    ? (
      Number(stakingLimitVal) *
      (Number(aprVal) / (100 * 31536000)) *
      (Number(interestDurationVal) * 24 * 3600)
    ) // convert from days to seconds
      .toLocaleString("en-US")
    : "--";

  const network = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);

  const nativeAddress = isSolana ? WSOL_ADDRESS : ZERO_ADDRESS;
  const { data: whitelistTokensData } = useGetWhitelistTokens({
    chainIds: network?.backendChainId,
    active: "1",
    isDropped: "0",
    kinds: "2",
  });
  const selectedStakingToken = stakingToken
    ? stakingToken === nativeAddress
      ? {
        imageUri: network?.iconSrc ?? "",
        symbol: network?.appKitNetwork.nativeCurrency.symbol ?? "",
      }
      : whitelistTokensData?.whitelistTokens.find(
        (t) => t.address === stakingToken,
      )
    : null;

  const onSubmit: SubmitHandler<CreateStakePoolFormValues> = async (values) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const isDraft = submitActionRef.current === "draft";
    try {
      if (isSolana) {
        const poolAddress = await createPoolSol({
          poolName: values.poolName.trim(),
          stakingToken: values.stakingToken,
          rewardToken: values.rewardToken,
          startTime: values.startTime,
          endTime: values.endTime,
          minStakingAmount: values.minStakingAmount,
          maxStakingAmount: values.maxStakingAmount || "0",
          stakingLimit: values.stakingLimit,
          budget: values.budget,
          lockDuration: Number(values.lockDuration) || 0,
          interestStartDelay: Number(values.interestStartDelay) || 0,
          interestAccrualDuration:
            values.interestAccrualDuration === "" ||
              values.interestAccrualDuration === undefined
              ? null
              : Number(values.interestAccrualDuration),
          claimStartDelay: Number(values.claimStartDelay) || 0,
          apr: Number(values.apr) || 0,
          lowRewardNotification: values.lowRewardNotification,
          stopAccrualAtPoolEnd: values.stopAccrualAtPoolEnd,
        });
        if (poolAddress) {
          if (!isDraft) await submitPoolSol(poolAddress);
          reset();
          navigate({
            to: "/admin/stake/detail/$address",
            params: { address: poolAddress },
            search: { depositReward: true },
          });
        }
        return;
      }

      // EVM handler
      const poolAddress = await createPoolEvm({
        name: values.poolName.trim(),
        stakingToken: values.stakingToken,
        rewardToken: values.rewardToken,
        startTime: values.startTime,
        endTime: values.endTime,
        minStakingAmount: values.minStakingAmount,
        maxStakingAmount: values.maxStakingAmount || "0",
        stakingLimit: values.stakingLimit,
        budget: values.budget,
        lockDuration: Number(values.lockDuration) || 0,
        interestStartDelay: Number(values.interestStartDelay) || 0,
        interestAccrualDuration:
          values.interestAccrualDuration === "" ||
            values.interestAccrualDuration === undefined
            ? null
            : Number(values.interestAccrualDuration),
        claimStartDelay: Number(values.claimStartDelay) || 0,
        apr: Number(values.apr) || 0,
        autoSubmit: !isDraft,
        stopAccrualAtPoolEnd: values.stopAccrualAtPoolEnd,
      });
      if (poolAddress) {
        reset();
        navigate({
          to: "/admin/stake/detail/$address",
          params: { address: poolAddress },
          search: { depositReward: true },
        });
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <form className="w-full max-w-xl space-y-6">
      {/* Pool Name */}
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Enter Pool Name"
          aria-invalid={!!errors.poolName}
          {...register("poolName", {
            validate: {
              required: (v) =>
                !submitAttemptedRef.current || v.trim().length > 0
                  ? true
                  : "Pool name is required",
              minLength: (v) =>
                !v.trim() || v.trim().length >= 3
                  ? true
                  : "Pool name must be at least 3 characters",
              maxLength: (v) =>
                !v.trim() || v.trim().length <= 50
                  ? true
                  : "Pool name must be at most 50 characters",
            },
          })}
        />
        {errors.poolName && (
          <p className="text-xs text-destructive">{errors.poolName.message}</p>
        )}
      </div>

      {/* ── Staking Acceptance Period ─────────────────────────── */}
      <div className="flex flex-col gap-3">
        <span className="text-xl font-medium">Staking Acceptance Period</span>
        <div className="flex gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[13px]">Start Time</span>
            <DatePicker
              value={startTime}
              onChange={(date) =>
                setValue("startTime", date as Date, {
                  shouldValidate: true,
                })
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
                validate: (v) => {
                  if (!v)
                    return submitAttemptedRef.current
                      ? "Start time is required"
                      : true;
                  if (v <= new Date())
                    return "Start time must be in the future";
                  if (endTime && v >= endTime)
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
                setValue("endTime", date as Date, {
                  shouldValidate: true,
                })
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
                validate: (v) => {
                  if (!v)
                    return submitAttemptedRef.current
                      ? "End time is required"
                      : true;
                  if (v <= new Date()) return "End time must be in the future";
                  if (startTime && v <= startTime)
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
      </div>

      {/* ── Staking Assets ────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <span className="text-xl font-medium">Staking Assets</span>

        {/* Staking Token */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">
            Staking Token <span className="text-destructive">*</span>
          </span>
          <WhitelistTokenSelect
            value={stakingToken}
            onChange={(addr) =>
              setValue("stakingToken", addr, {
                shouldValidate: true,
              })
            }
            poolKind={2}
          />
          <input
            type="hidden"
            {...register("stakingToken", {
              validate: (v) =>
                !submitAttemptedRef.current || !!v
                  ? true
                  : "Staking token is required",
            })}
          />
          <p className="text-[11px]">Select from whitelist tokens only</p>
          {errors.stakingToken && (
            <p className="text-xs text-destructive">
              {errors.stakingToken.message}
            </p>
          )}
        </div>

        {/* Min / Max Staking Amount */}
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">Min Staking Amount</span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                aria-invalid={!!errors.minStakingAmount}
                {...register("minStakingAmount", {
                  validate: (v) => {
                    if (!v || v === "") return true;
                    const max = Number(getValues("maxStakingAmount"));
                    if (max && max > 0 && Number(v) > max)
                      return "Min staking amount must be \u2264 max staking amount";
                    if (Number(v) < 0) return "Must be ≥ 0";
                    if (v.includes(".") && v.split(".")[1].length > 6)
                      return "Max 6 decimal places allowed";
                    return true;
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                {selectedStakingToken && (
                  <img
                    src={selectedStakingToken.imageUri}
                    alt={selectedStakingToken.symbol}
                    className="size-4 rounded-full"
                  />
                )}
                <span className="text-xs font-medium">
                  {selectedStakingToken
                    ? "customSymbol" in selectedStakingToken
                      ? selectedStakingToken.customSymbol?.trim() ||
                      selectedStakingToken.symbol
                      : selectedStakingToken.symbol
                    : ""}
                </span>
              </InputGroupAddon>
            </InputGroup>
            {errors.minStakingAmount && (
              <p className="text-xs text-destructive">
                {errors.minStakingAmount.message}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">Max Staking Amount</span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                aria-invalid={!!errors.maxStakingAmount}
                {...register("maxStakingAmount", {
                  validate: (v) => {
                    if (!v || v === "") return true;
                    if (Number(v) <= 0) return "Must be greater than 0";
                    const min = getValues("minStakingAmount");
                    if (min && Number(v) < Number(min))
                      return "Must be greater than or equal to min staking amount";
                    const limit = Number(getValues("stakingLimit"));
                    if (limit > 0 && Number(v) > limit)
                      return "Max staking amount must be \u2264 staking limit";
                    if (v.includes(".") && v.split(".")[1].length > 6)
                      return "Max 6 decimal places allowed";
                    return true;
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                {selectedStakingToken && (
                  <img
                    src={selectedStakingToken.imageUri}
                    alt={selectedStakingToken.symbol}
                    className="size-4 rounded-full"
                  />
                )}
                <span className="text-xs font-medium">
                  {selectedStakingToken
                    ? "customSymbol" in selectedStakingToken
                      ? selectedStakingToken.customSymbol?.trim() ||
                      selectedStakingToken.symbol
                      : selectedStakingToken.symbol
                    : ""}
                </span>
              </InputGroupAddon>
            </InputGroup>
            {errors.maxStakingAmount && (
              <p className="text-xs text-destructive">
                {errors.maxStakingAmount.message}
              </p>
            )}
          </div>
        </div>

        {/* Staking Limit */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">Staking Limit</span>
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            aria-invalid={!!errors.stakingLimit}
            {...register("stakingLimit", {
              validate: (v) => {
                if (!v || v === "") return true;
                if (Number(v) <= 0) return "Staking limit must be > 0";
                const max = Number(getValues("maxStakingAmount"));
                if (max > 0 && Number(v) < max)
                  return "Staking limit must be \u2265 max staking amount";
                if (v.includes(".") && v.split(".")[1].length > 6)
                  return "Max 6 decimal places allowed";
                return true;
              },
            })}
          />
          {errors.stakingLimit && (
            <p className="text-xs text-destructive">
              {errors.stakingLimit.message}
            </p>
          )}
        </div>
      </div>

      {/* ── Reward Setting ────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <span className="text-xl font-medium">Reward Setting</span>

        {/* Reward Token */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">
            Reward Token <span className="text-destructive">*</span>
          </span>
          <WhitelistTokenSelect
            value={rewardToken}
            onChange={(addr) =>
              setValue("rewardToken", addr, {
                shouldValidate: true,
              })
            }
            poolKind={2}
          />
          <input
            type="hidden"
            {...register("rewardToken", {
              validate: (v) =>
                !submitAttemptedRef.current || !!v
                  ? true
                  : "Reward token is required",
            })}
          />
          <p className="text-[11px]">Select from whitelist tokens only</p>
          {errors.rewardToken && (
            <p className="text-xs text-destructive">
              {errors.rewardToken.message}
            </p>
          )}
        </div>

        {/* Lock-up Duration / Interest Start Delay */}
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">
              Lock-up Duration <span className="text-destructive">*</span>
            </span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min={MIN_DAYS}
                step="any"
                placeholder="0"
                aria-invalid={!!errors.lockDuration}
                {...register("lockDuration", {
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Lock-up duration is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= MIN_DAYS
                        ? true
                        : `Must be ≥ ${MIN_DAYS}`,
                    // decimals: (v) =>
                    //   !v || !v.includes(".") || v.split(".")[1].length <= 6
                    //     ? true
                    //     : "Max 6 decimal places allowed",
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                <span className="text-xs">days</span>
              </InputGroupAddon>
            </InputGroup>
            {errors.lockDuration && (
              <p className="text-xs text-destructive">
                {errors.lockDuration.message}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">
              Interest Start Delay <span className="text-destructive">*</span>
            </span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min={MIN_DAYS}
                step="any"
                placeholder="0"
                aria-invalid={!!errors.interestStartDelay}
                {...register("interestStartDelay", {
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Interest start delay is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= 0 ? true : "Must be \u2265 0",
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                <span className="text-xs">days</span>
              </InputGroupAddon>
            </InputGroup>
            {errors.interestStartDelay && (
              <p className="text-xs text-destructive">
                {errors.interestStartDelay.message}
              </p>
            )}
          </div>
        </div>

        {/* Interest Accrual Duration / Claim Start Delay */}
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">Interest Accrual Duration</span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min={MIN_DAYS}
                step="any"
                placeholder="0"
                {...register("interestAccrualDuration", {
                  validate: (v) => {
                    if (!v) return true;
                    if (Number(v) < MIN_DAYS) return `Must be ≥ ${MIN_DAYS}`;
                    return true;
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                <span className="text-xs">days</span>
              </InputGroupAddon>
            </InputGroup>
            {errors.interestAccrualDuration && (
              <p className="text-xs text-destructive">
                {errors.interestAccrualDuration.message}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px]">
              Claim Start Delay <span className="text-destructive">*</span>
            </span>
            <InputGroup className="h-fit">
              <Input
                type="number"
                min={MIN_DAYS}
                step="any"
                placeholder="0"
                aria-invalid={!!errors.claimStartDelay}
                {...register("claimStartDelay", {
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Claim start delay is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= MIN_DAYS
                        ? true
                        : `Must be ≥ ${MIN_DAYS}`,
                    // decimals: (v) =>
                    //   !v || !v.includes(".") || v.split(".")[1].length <= 6
                    //     ? true
                    //     : "Max 6 decimal places allowed",
                  },
                })}
              />
              <InputGroupAddon align="inline-end">
                <span className="text-xs">days</span>
              </InputGroupAddon>
            </InputGroup>
            {errors.claimStartDelay && (
              <p className="text-xs text-destructive">
                {errors.claimStartDelay.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <BlueSwitch
            active={stopAccrualAtPoolEnd}
            onClick={(e) => {
              e?.stopPropagation();
              setValue("stopAccrualAtPoolEnd", !stopAccrualAtPoolEnd);
            }}
          />
          <div className="flex-col">
            <span className="text-[13px]">
              Stop at pool end{" "}
              <InfoTooltip
                classNames={{
                  icon: "size-3.5 text-xs",
                  contentContainer: "max-h-fit",
                  textContainer: "min-h-10",
                }}
                side="right"
                content="If enabled, interest calculation will strictly stop at the pool's end time, even if the user's accrual duration has not finished."
              />
            </span>
            <div className="text-tiny text-mb-gray-71a">(Recommended)</div>
          </div>
        </div>

        {/* APR */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">
            APR <span className="text-destructive">*</span>
          </span>
          <InputGroup className="h-fit max-w-64">
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              aria-invalid={!!errors.apr}
              {...register("apr", {
                validate: {
                  required: (v) =>
                    !submitAttemptedRef.current || v !== ""
                      ? true
                      : "APR is required",
                  gtZero: (v) =>
                    !v || Number(v) > 0 ? true : "APR must be > 0",
                  decimals: (v) =>
                    !v || !v.includes(".") || v.split(".")[1].length <= 6
                      ? true
                      : "Max 6 decimal places allowed",
                },
              })}
            />
            <InputGroupAddon align="inline-end">
              <span className="text-xs">%</span>
            </InputGroupAddon>
          </InputGroup>
          {errors.apr && (
            <p className="text-xs text-destructive">{errors.apr.message}</p>
          )}
        </div>
      </div>

      {/* ── Network ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-xl font-medium">Network</span>
        <div className="relative flex max-w-xs gap-2 rounded-md-plus bg-inactive px-14 py-1 text-[15px] text-nowrap">
          <NetworkIcon
            networkId={network?.id || ("" as NetworkId)}
            className="absolute left-4"
          />
          <span>{network?.label}</span>
        </div>
      </div>

      {/* ── Deposit Reward Tokens ─────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-xl font-medium">Deposit Reward Tokens</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">Budget</span>
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            aria-invalid={!!errors.budget}
            {...register("budget", {
              validate: (v) => {
                if (!v) return true;
                if (Number(v) < 0) return "Budget must be ≥ 0";
                if (v.includes(".") && v.split(".")[1].length > 6)
                  return "Max 6 decimal places allowed";
                return true;
              },
            })}
            className="max-w-xs"
          />
          {errors.budget && (
            <p className="text-xs text-destructive">{errors.budget.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">Max Reward Amount</span>
          <Input
            type="text"
            readOnly
            disabled={!maxRewardEnabled}
            value={maxRewardDisplay}
            className="max-w-xs"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">Max Reward Amount</span>
          <Input
            type="text"
            readOnly
            disabled={!maxRewardEnabled}
            value={maxRewardDisplay}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────── */}
      <div className="flex justify-center gap-4 pt-4">
        <AnimateIconButton
          iconLetter="C"
          text="Cancel"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "text-center after:text-white after:text-base after:font-semibold",
            text: "text-base font-medium",
            icon: "size-7 text-base",
          }}
          color="#FF8E8E"
          btnProps={{
            type: "button",
            disabled: isSubmitting,
            onClick: () => {
              reset();
              navigate({ to: "/admin/master-pool-management" });
            },
          }}
        />
        <AnimateIconButton
          iconLetter="D"
          text="Save as Draft"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "text-center after:text-white after:text-base after:font-semibold",
            text: "text-base font-medium",
            icon: "size-7 text-base",
          }}
          color="#F59E0B"
          isLoading={isSubmitting && submitActionRef.current === "draft"}
          isLoadingText="Saving..."
          btnProps={{
            type: "button",
            disabled: isSubmitting,
            onClick: () => {
              submitAttemptedRef.current = true;
              submitActionRef.current = "draft";
              handleSubmit(onSubmit)();
            },
          }}
        />
        <AnimateIconButton
          iconLetter="S"
          text="Submit"
          variant="letter-icon"
          textVariant="text-container-center"
          classNames={{
            btn: "text-center after:text-white after:text-base after:font-semibold",
            text: "text-base font-medium",
            icon: "size-7 text-base",
          }}
          color="#966EFF"
          isLoading={isSubmitting && submitActionRef.current === "submit"}
          isLoadingText="Submitting..."
          btnProps={{
            type: "button",
            disabled: isSubmitting,
            onClick: () => {
              submitAttemptedRef.current = true;
              submitActionRef.current = "submit";
              handleSubmit(onSubmit)();
            },
          }}
        />
      </div>
    </form>
  );
};

export default CreateStakePoolForm;
