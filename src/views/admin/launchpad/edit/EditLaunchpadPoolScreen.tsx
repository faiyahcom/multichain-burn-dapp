import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import Decimal from "decimal.js";
import { DatePicker } from "@/components/ui/date-picker";
import { NumericInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import BlueSwitch from "@/components/common/blue-switch";
import { poolService } from "@/services/poolService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useNavigate } from "@tanstack/react-router";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEditLaunchpadPoolEvmFn } from "./useEditLaunchpadPoolEvmFn";
import { useEditLaunchpadPoolSolFn } from "./useEditLaunchpadPoolSolFn";
import PoolOverview from "../detail/pool-overview";
import type { BurnPoolStatus } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";

type ClaimPolicyValue = "instant" | "after_end_auto" | "after_end_claim";

type EditLaunchpadFormValues = {
  poolName: string;
  startTime: Date;
  endTime: Date;
  price: string;
  budget: string; // total sale amount (human-readable)
  claimPolicy: ClaimPolicyValue;
  rewardVisibility: boolean;
};

const formatScheduleTime = (ts: string) =>
  format(new Date(Number(ts) * 1000), "MMM dd, yyyy, HH:mm") + " UTC";

export default function EditLaunchpadPoolScreen({
  poolAddress,
}: {
  poolAddress: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inFlightRef = useRef(false);
  const submitAttemptedRef = useRef(false);

  const { caipAddress } = useAppKitAccount();
  const isSolana = caipAddress?.split(":")[0] === "solana";

  const { editPool: editPoolEvm } = useEditLaunchpadPoolEvmFn();
  const { editPool: editPoolSol } = useEditLaunchpadPoolSolFn();

  const { data: poolDetail, isLoading } = useQuery({
    queryKey: poolQueryKeys.detail(poolAddress),
    queryFn: () => poolService.getPoolDetail(poolAddress),
  });

  const pool = poolDetail?.pool;
  const safeStatus: BurnPoolStatus =
    (pool?.status as BurnPoolStatus) ?? "draft";
  const statusDisplay =
    BURN_POOL_STATUS[safeStatus] ?? BURN_POOL_STATUS["draft"];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditLaunchpadFormValues>({
    mode: "onChange",
    defaultValues: {
      poolName: "",
      price: "",
      budget: "",
      claimPolicy: "after_end_claim" as ClaimPolicyValue,
      rewardVisibility: false,
    },
  });

  // Pre-fill form once pool loads
  useEffect(() => {
    if (!pool) return;
    const poolIsFixed =
      !!pool.rewardDenominator && Number(pool.rewardDenominator) !== 0;
    reset({
      poolName: pool.name ?? "",
      startTime: new Date(Number(pool.timeStart) * 1000),
      endTime: new Date(Number(pool.timeEnd) * 1000),
      price: poolIsFixed
        ? String(Number(pool.rewardDenominator) / Number(pool.rewardNumerator))
        : "",
      budget: pool.rewardAmount
        ? new Decimal(pool.rewardAmount)
            .div(new Decimal(10).pow(pool.rewardTokenDecimals ?? 0))
            .toFixed()
        : "",
      claimPolicy: (() => {
        if (pool.claimPolicy === "instant") return "instant";
        if (
          pool.claimPolicy === "after_end" &&
          pool.distributionMode === "automatic"
        )
          return "after_end_auto";
        return "after_end_claim";
      })() as ClaimPolicyValue,
      rewardVisibility: pool.rewardVisibility ?? false,
    });
  }, [pool?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const claimPolicy = watch("claimPolicy");
  const price = watch("price");
  const budget = watch("budget");

  const onSubmit = async (values: EditLaunchpadFormValues) => {
    if (!pool || inFlightRef.current) return;
    inFlightRef.current = true;
    const editParams = {
      poolAddress: pool.address,
      name: values.poolName.trim(),
      startTime: Math.floor(values.startTime.getTime() / 1000),
      endTime: Math.floor(values.endTime.getTime() / 1000),
      mode: (poolIsFixed ? "fixed" : "dynamic") as "fixed" | "dynamic",
      price: values.price,
      claimPolicy: values.claimPolicy,
      rewardVisibility: values.rewardVisibility,
      budget: values.budget,
      saleTokenDecimals: pool.rewardTokenDecimals ?? 18,
    };
    try {
      if (isSolana) {
        await editPoolSol({
          ...editParams,
          targetAddress: pool.targetAddress ?? undefined,
        });
      } else {
        await editPoolEvm({
          ...editParams,
          saleToken: pool.rewardToken ?? "",
        });
      }

      queryClient.invalidateQueries({
        queryKey: poolQueryKeys.detail(pool.address),
      });
      navigate({
        to: "/admin/launchpad/detail/$address",
        params: { address: pool.address },
      });
    } catch {
      // error handled in hook
    } finally {
      inFlightRef.current = false;
    }
  };

  if (isLoading || !pool) return <div className="p-8">Loading...</div>;

  const poolIsFixed =
    !!pool.rewardDenominator && Number(pool.rewardDenominator) !== 0;
  const isFixed = poolIsFixed;
  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const network = pool.chainId
    ? chainIdToNetworkConfig(pool.chainId)
    : undefined;
  const saleTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: pool.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });
  const saleSymbol = saleTokenDisplay.symbol;

  const formTargetRaised = (() => {
    if (!isFixed) return null;
    const result = Number(price) * Number(budget);
    return Number.isFinite(result) && result > 0 ? result : null;
  })();

  return (
    <div className="p-4 pb-10 md:pt-9.5 md:pr-14 md:pl-14">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-1 lg:flex-row">
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold">Update Launchpad Pool</h2>
          <p className="text-base text-greyed">
            Update this launchpad pool's settings.
          </p>
        </div>
        <AnimateIconButton
          iconLetter={statusDisplay.letter}
          textVariant="text-container-center"
          text={statusDisplay.label}
          color={statusDisplay.color}
          hasGroupHover
          classNames={{
            btn: "min-w-27 cursor-default after:text-2xl after:font-medium",
            text: "text-2xl font-medium",
            icon: "size-9 text-3xl",
          }}
        />
      </div>

      {/* Pool Overview */}
      <PoolOverview poolDetail={poolDetail} />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── Schedule ───────────────────────────────────────── */}
        <div className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {/* Current Schedule */}
          <div className="py-4">
            <div className="flex items-center gap-2 pb-4">
              <div className="h-1.5 w-1.5 bg-black" />
              <h3 className="font-semibold">Current Settings</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Pool Name</span>
                <span className="max-w-[60%] text-right font-medium break-all">
                  {pool.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Pool Type</span>
                <span className="font-medium">
                  {!pool.rewardDenominator ||
                  Number(pool.rewardDenominator) === 0
                    ? "Dynamic"
                    : "Fixed"}
                </span>
              </div>
              {!!pool.rewardDenominator &&
                Number(pool.rewardDenominator) !== 0 && (
                  <div className="flex justify-between gap-2">
                    <span className="text-greyed">Price</span>
                    <span className="font-medium">
                      {Number(pool.rewardDenominator) /
                        Number(pool.rewardNumerator)}
                    </span>
                  </div>
                )}
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Budget</span>
                <span className="font-medium">
                  {pool.rewardAmount
                    ? `${formatAmount(pool.rewardAmount, pool.rewardTokenDecimals ?? 0)} ${saleSymbol}`
                    : "—"}
                </span>
              </div>
              {/* {currentTargetRaised !== null && (
                <div className="flex justify-between gap-2">
                  <span className="text-greyed">Total Target Raised</span>
                  <span className="font-medium">
                    {shortenNumber({ number: currentTargetRaised })} {paymentSymbol}
                  </span>
                </div>
              )}{" "} */}
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Claim Policy</span>
                <span className="font-medium">
                  {pool.claimPolicy === "instant"
                    ? "Instant"
                    : pool.distributionMode === "automatic"
                      ? "After End \u2013 Auto"
                      : "After End \u2013 Claim"}
                </span>
              </div>
              {!poolIsFixed && (
                <div className="flex justify-between gap-2">
                  <span className="text-greyed">Reward Visibility</span>
                  <span className="font-medium">
                    {pool.rewardVisibility ? "Public" : "Hidden"}
                  </span>
                </div>
              )}{" "}
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Start Time</span>
                <span className="font-medium">
                  {formatScheduleTime(pool.timeStart)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-greyed">End Time</span>
                <span className="font-medium">
                  {formatScheduleTime(pool.timeEnd)}
                </span>
              </div>
            </div>
          </div>

          {/* Update Schedule */}
          <div className="py-4">
            <div className="flex items-center gap-2 pb-4">
              <div className="h-1.5 w-1.5 bg-black" />
              <h3 className="font-semibold">Update Settings</h3>
            </div>
            <div className="space-y-4">
              {/* Pool Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Pool Name</label>
                <Input
                  {...register("poolName", {
                    validate: {
                      required: (v) =>
                        v.trim().length > 0 ? true : "Pool name is required",
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
                  placeholder="Enter pool name"
                  className="w-full"
                />
                {errors.poolName && (
                  <p className="text-xs text-destructive">
                    {errors.poolName.message}
                  </p>
                )}
              </div>

              {/* Price (fixed mode only) */}
              {isFixed && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Price</label>
                  <Controller
                    name="price"
                    control={control}
                    rules={{
                      validate: (v) => {
                        if (!v || v === "")
                          return "Price is required for Fixed mode";
                        if (Number(v) <= 0)
                          return "Price must be greater than 0";
                        return true;
                      },
                    }}
                    render={({ field }) => (
                      <NumericInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter price"
                        className="w-full"
                      />
                    )}
                  />
                  {errors.price && (
                    <p className="text-xs text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              )}

              {/* Budget */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Budget</label>
                <Controller
                  name="budget"
                  control={control}
                  rules={{
                    validate: (v) => {
                      if (!v || v === "")
                        return submitAttemptedRef.current
                          ? "Budget is required"
                          : true;
                      if (Number(v) <= 0)
                        return "Budget must be greater than 0";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter total sale amount"
                      className="w-full"
                    />
                  )}
                />
                {errors.budget && (
                  <p className="text-xs text-destructive">
                    {errors.budget.message}
                  </p>
                )}
              </div>

              {/* Total Target Raised (fixed pools only) */}
              {poolIsFixed && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px]">Total Target Raised</span>
                  <Input
                    type="text"
                    readOnly
                    value={shortenNumber({ number: formTargetRaised ?? 0 })}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Claim Policy */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Claim Policy</label>
                <Controller
                  control={control}
                  name="claimPolicy"
                  render={({ field }) => (
                    <RadioGroup
                      value={
                        field.value === "instant" ? "instant" : "after_end"
                      }
                      onValueChange={(val) => {
                        if (val === "instant") {
                          field.onChange("instant");
                        } else if (field.value === "instant") {
                          field.onChange("after_end_claim");
                        }
                      }}
                      className="flex flex-col gap-2.5"
                    >
                      {isFixed && (
                        <RadioGroupItem value="instant">
                          <span>Instant</span>
                        </RadioGroupItem>
                      )}
                      <RadioGroupItem value="after_end">
                        <span>After End</span>
                      </RadioGroupItem>
                    </RadioGroup>
                  )}
                />
                {claimPolicy !== "instant" && (
                  <Controller
                    control={control}
                    name="claimPolicy"
                    render={({ field }) => (
                      <RadioGroup
                        value={
                          field.value === "after_end_auto"
                            ? "after_end_auto"
                            : "after_end_claim"
                        }
                        onValueChange={(val) =>
                          field.onChange(val as ClaimPolicyValue)
                        }
                        className="ml-5 flex flex-col"
                      >
                        <RadioGroupItem
                          value="after_end_auto"
                          className="bg-transparent"
                        >
                          <span>Auto Distribution</span>
                        </RadioGroupItem>
                        <RadioGroupItem
                          value="after_end_claim"
                          className="bg-transparent"
                        >
                          <span>Claim Mode</span>
                        </RadioGroupItem>
                      </RadioGroup>
                    )}
                  />
                )}
              </div>

              {/* Reward Visibility (dynamic pools only) */}
              {!isFixed && (
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">
                    Reward Visibility
                  </label>
                  <Controller
                    control={control}
                    name="rewardVisibility"
                    render={({ field }) => (
                      <BlueSwitch
                        active={field.value}
                        onClick={() => field.onChange(!field.value)}
                      />
                    )}
                  />
                </div>
              )}

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Time</label>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{
                    validate: (v) => {
                      if (!v) return "Start time is required";
                      if (v <= new Date())
                        return "Start time must be in the future";
                      if (endTime && v >= endTime)
                        return "Start time must be before end time";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={(date) =>
                        date < today || (endTime ? date > endTime : false)
                      }
                      className="w-full"
                    />
                  )}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium">End Time</label>
                <Controller
                  name="endTime"
                  control={control}
                  rules={{
                    validate: (v) => {
                      if (!v) return "End time is required";
                      if (v <= new Date())
                        return "End time must be in the future";
                      if (startTime && v <= startTime)
                        return "End time must be after start time";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={(date) => date < (startTime ?? today)}
                      className="w-full"
                    />
                  )}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-center gap-4 pt-4">
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
              onClick: () =>
                navigate({
                  to: "/admin/launchpad/detail/$address",
                  params: { address: pool.address },
                }),
            }}
          />
          <AnimateIconButton
            iconLetter="S"
            text="Update Pool"
            variant="letter-icon"
            textVariant="text-container-center"
            classNames={{
              btn: "text-center after:text-white after:text-base after:font-semibold",
              text: "text-base font-medium",
              icon: "size-7 text-base",
            }}
            color="#966EFF"
            isLoading={isSubmitting}
            isLoadingText="Updating..."
            btnProps={{
              type: "button",
              disabled: isSubmitting,
              onClick: () => {
                submitAttemptedRef.current = true;
                handleSubmit(onSubmit)();
              },
            }}
          />
        </div>
      </form>
    </div>
  );
}
