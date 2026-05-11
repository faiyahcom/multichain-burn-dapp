import { useRef, useMemo } from "react";
import { format } from "date-fns";
import { NumericInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { useAppKitAccount } from "@reown/appkit/react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
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
  interestStopDate: Date | undefined;
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
    control,
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
      interestStopDate: undefined,
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
  const lockDurationVal = watch("lockDuration");
  const interestStartDelayVal = watch("interestStartDelay");
  const claimStartDelayVal = watch("claimStartDelay");
  const interestStopDateVal = watch("interestStopDate");

  const validInterestStopRange = useMemo(() => {
    const startSec = startTime ? startTime.getTime() / 1000 : null;
    const endSec = endTime ? endTime.getTime() / 1000 : null;
    if (!startSec || !endSec || endSec <= startSec) return null;
    const lockDays = Number(lockDurationVal) || 0;
    const interestDelayDays = Number(interestStartDelayVal) || 0;
    const interestAccrualDays =
      interestDurationVal && Number(interestDurationVal) > 0
        ? Number(interestDurationVal)
        : null;
    const claimDelayDays = Number(claimStartDelayVal) || 0;
    const D = endSec - startSec;
    const lockSec = lockDays * 86400;
    const interestDelaySec = interestDelayDays * 86400;
    const claimDelaySec = claimDelayDays * 86400;
    if (lockSec <= D + interestDelaySec) return null;
    if (claimDelaySec <= D) return null;
    if (interestAccrualDays !== null && interestAccrualDays * 86400 <= D) return null;
    const lower = endSec + interestDelaySec;
    const upperCandidates: number[] = [
      startSec + lockSec,
      startSec + interestDelaySec + claimDelaySec,
    ];
    if (interestAccrualDays !== null) {
      upperCandidates.push(startSec + interestDelaySec + interestAccrualDays * 86400);
    }
    const upper = Math.min(...upperCandidates);
    if (lower >= upper) return null;
    return { lower, upper };
  }, [startTime, endTime, lockDurationVal, interestStartDelayVal, interestDurationVal, claimStartDelayVal]);

  const interestStopWarnings = useMemo((): string[] | null => {
    if (validInterestStopRange) return null;
    const startSec = startTime ? startTime.getTime() / 1000 : null;
    const endSec = endTime ? endTime.getTime() / 1000 : null;
    if (!startSec || !endSec || endSec <= startSec) return null;
    // Only evaluate infeasibility once both required duration fields are filled
    if (!lockDurationVal || !claimStartDelayVal) return null;
    const D = endSec - startSec;
    const D_days = D / 86400;
    const lockDays = Number(lockDurationVal) || 0;
    const interestDelayDays = Number(interestStartDelayVal) || 0;
    const claimDelayDays = Number(claimStartDelayVal) || 0;
    const interestAccrualDays =
      interestDurationVal && Number(interestDurationVal) > 0
        ? Number(interestDurationVal)
        : null;
    const reasons: string[] = [];
    if (lockDays * 86400 <= D + interestDelayDays * 86400)
      reasons.push(`Lock-up Duration must be > ${D_days + interestDelayDays} days (pool duration ${D_days} + interest start delay ${interestDelayDays})`);
    if (claimDelayDays * 86400 <= D)
      reasons.push(`Claim Start Delay must be > ${D_days} days (pool duration)`);
    if (interestAccrualDays !== null && interestAccrualDays * 86400 <= D)
      reasons.push(`Interest Accrual Duration must be > ${D_days} days (pool duration)`);
    return reasons.length > 0 ? reasons : null;
  }, [validInterestStopRange, startTime, endTime, lockDurationVal, interestStartDelayVal, interestDurationVal, claimStartDelayVal]);

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
          interestStopDate: values.interestStopDate,
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
        interestStopDate: values.interestStopDate,
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
              <Controller
                control={control}
                name="minStakingAmount"
                rules={{
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
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    aria-invalid={!!errors.minStakingAmount}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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
              <Controller
                control={control}
                name="maxStakingAmount"
                rules={{
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
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    aria-invalid={!!errors.maxStakingAmount}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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
          <Controller
            control={control}
            name="stakingLimit"
            rules={{
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
            }}
            render={({ field }) => (
              <NumericInput
                placeholder="0"
                aria-invalid={!!errors.stakingLimit}
                value={field.value}
                onChange={field.onChange}
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
              />
            )}
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
              <Controller
                control={control}
                name="lockDuration"
                rules={{
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Lock-up duration is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= MIN_DAYS
                        ? true
                        : `Must be ≥ ${MIN_DAYS}`,
                  },
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    aria-invalid={!!errors.lockDuration}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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
              <Controller
                control={control}
                name="interestStartDelay"
                rules={{
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Interest start delay is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= 0 ? true : "Must be \u2265 0",
                  },
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    aria-invalid={!!errors.interestStartDelay}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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
              <Controller
                control={control}
                name="interestAccrualDuration"
                rules={{
                  validate: (v) => {
                    if (!v) return true;
                    if (Number(v) < MIN_DAYS) return `Must be ≥ ${MIN_DAYS}`;
                    return true;
                  },
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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
              <Controller
                control={control}
                name="claimStartDelay"
                rules={{
                  validate: {
                    required: (v) =>
                      !submitAttemptedRef.current || v !== ""
                        ? true
                        : "Claim start delay is required",
                    gte0: (v) =>
                      v === "" || Number(v) >= MIN_DAYS
                        ? true
                        : `Must be ≥ ${MIN_DAYS}`,
                  },
                }}
                render={({ field }) => (
                  <NumericInput
                    placeholder="0"
                    aria-invalid={!!errors.claimStartDelay}
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                  />
                )}
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

        {/* Interest Stop Date */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">Interest Stop Date</span>
          {validInterestStopRange ? (
            <p className="text-[11px] text-greyed">
              Valid value must be after {" "}
              {format(new Date(validInterestStopRange.lower * 1000), "MMM dd, yyyy, HH:mm")}
              {" and before "}
              {format(new Date(validInterestStopRange.upper * 1000), "MMM dd, yyyy, HH:mm")}
            </p>
          ) : interestStopWarnings ? (
            <div className="space-y-0.5">
              {interestStopWarnings.map((reason, i) => (
                <p key={i} className="text-[11px] text-greyed">{reason}</p>
              ))}
            </div>
          ) : (
            startTime && endTime && (
              <p className="text-[11px] text-greyed">
                Set Lock-up Duration, Claim Start Delay, and Interest Start Delay to see valid range.
              </p>
            )
          )}
          <div className="flex items-center gap-2">
            <DatePicker
              value={interestStopDateVal}
              onChange={(date) =>
                setValue("interestStopDate", date as Date | undefined, {
                  shouldValidate: true,
                })
              }
              disabled={(date) => {
                if (!validInterestStopRange) return false;
                const ts = date.getTime() / 1000;
                return ts < validInterestStopRange.lower || ts >= validInterestStopRange.upper;
              }}
            />
            {interestStopDateVal && (
              <button
                type="button"
                className="text-xs text-greyed hover:text-destructive"
                onClick={() =>
                  setValue("interestStopDate", undefined, { shouldValidate: true })
                }
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="hidden"
            {...register("interestStopDate", {
              validate: (v) => {
                if (!v) return true;
                const start = getValues("startTime");
                const end = getValues("endTime");
                if (!start || !end) return true;
                const startSec = start.getTime() / 1000;
                const endSec = end.getTime() / 1000;
                const interestDelayDays = Number(getValues("interestStartDelay")) || 0;
                const lockDays = Number(getValues("lockDuration")) || 0;
                const interestAccrualStr = getValues("interestAccrualDuration");
                const claimDelayDays = Number(getValues("claimStartDelay")) || 0;
                const D = endSec - startSec;
                const interestDelaySec = interestDelayDays * 86400;
                const lockSec = lockDays * 86400;
                const claimDelaySec = claimDelayDays * 86400;
                if (lockSec <= D + interestDelaySec) return "Lock-up Duration too short";
                if (claimDelaySec <= D)
                  return "Claim Start Delay must be greater than pool duration";
                const dateTs = v.getTime() / 1000;
                const lower = endSec + interestDelaySec;
                const upperCandidates: number[] = [
                  startSec + lockSec,
                  startSec + interestDelaySec + claimDelaySec,
                ];
                if (interestAccrualStr && Number(interestAccrualStr) > 0) {
                  const accrualSec = Number(interestAccrualStr) * 86400;
                  if (accrualSec <= D)
                    return "Interest Accrual Duration must be greater than pool duration";
                  upperCandidates.push(startSec + interestDelaySec + accrualSec);
                }
                const upper = Math.min(...upperCandidates);
                if (dateTs <= lower || dateTs >= upper)
                  return "Interest Stop Date out of valid range";
                return true;
              },
            })}
          />
          {errors.interestStopDate && (
            <p className="text-xs text-destructive">
              {errors.interestStopDate.message}
            </p>
          )}
        </div>

        {/* APR */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px]">
            APR <span className="text-destructive">*</span>
          </span>
          <InputGroup className="h-fit max-w-64">
            <Controller
              control={control}
              name="apr"
              rules={{
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
              }}
              render={({ field }) => (
                <NumericInput
                  placeholder="0"
                  aria-invalid={!!errors.apr}
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                />
              )}
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
          <Controller
            control={control}
            name="budget"
            rules={{
              validate: (v) => {
                if (!v) return true;
                if (Number(v) < 0) return "Budget must be ≥ 0";
                if (v.includes(".") && v.split(".")[1].length > 6)
                  return "Max 6 decimal places allowed";
                return true;
              },
            }}
            render={({ field }) => (
              <NumericInput
                placeholder="0"
                aria-invalid={!!errors.budget}
                className="max-w-xs"
                value={field.value}
                onChange={field.onChange}
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
              />
            )}
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
              navigate({
                to: "/admin/master-pool-management",
                search: { tab: "stake-pool" },
              });
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
