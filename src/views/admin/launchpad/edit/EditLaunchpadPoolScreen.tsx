import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { formatAmount } from "@/utils/helpers/numbers";
import { DatePicker } from "@/components/ui/date-picker";
import { NumericInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { poolService } from "@/services/poolService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useNavigate } from "@tanstack/react-router";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { useEditLaunchpadPoolEvmFn } from "./useEditLaunchpadPoolEvmFn";
import PoolOverview from "../detail/pool-overview";
import type { BurnPoolStatus } from "@/types/pool";

type ClaimPolicyValue = "instant" | "after_end_auto" | "after_end_claim";

type EditLaunchpadFormValues = {
  poolName: string;
  startTime: Date;
  endTime: Date;
  price: string;
  budget: string; // total sale amount (human-readable)
  claimPolicy: ClaimPolicyValue;
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

  const { editPool: editPoolEvm } = useEditLaunchpadPoolEvmFn();

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
        ? String(
            Number(pool.rewardDenominator) / Number(pool.rewardNumerator),
          )
        : "",
      budget: pool.rewardAmount
        ? formatAmount(pool.rewardAmount, pool.rewardTokenDecimals ?? 0)
        : "",
      claimPolicy: (() => {
        if (pool.claimPolicy === 0) return "instant";
        if (pool.claimPolicy === 1 && pool.distributionMode === 1) return "after_end_auto";
        return "after_end_claim";
      })() as ClaimPolicyValue,
    });
  }, [pool?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const claimPolicy = watch("claimPolicy");

  const onSubmit = async (values: EditLaunchpadFormValues) => {
    if (!pool || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      await editPoolEvm({
        poolAddress: pool.address,
        name: values.poolName.trim(),
        startTime: Math.floor(values.startTime.getTime() / 1000),
        endTime: Math.floor(values.endTime.getTime() / 1000),
        mode: poolIsFixed ? "fixed" : "dynamic",
        price: values.price,
        claimPolicy: values.claimPolicy,
        budget: values.budget,
        saleToken: pool.rewardToken ?? "",
        saleTokenDecimals: pool.rewardTokenDecimals ?? 18,
      });

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
                <span className="max-w-[60%] break-all text-right font-medium">
                  {pool.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-greyed">Pool Type</span>
                <span className="font-medium">
                  {!pool.rewardDenominator || Number(pool.rewardDenominator) === 0
                    ? "Dynamic"
                    : "Fixed"}
                </span>
              </div>
              {!!pool.rewardDenominator && Number(pool.rewardDenominator) !== 0 && (
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
                    ? formatAmount(pool.rewardAmount, pool.rewardTokenDecimals ?? 0)
                    : "—"}
                </span>
              </div>              <div className="flex justify-between gap-2">
                <span className="text-greyed">Claim Policy</span>
                <span className="font-medium">
                  {pool.claimPolicy === 0
                    ? "Instant"
                    : pool.distributionMode === 1
                      ? "After End \u2013 Auto"
                      : "After End \u2013 Claim"}
                </span>
              </div>              <div className="flex justify-between gap-2">
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
                    required: "Pool name is required",
                    maxLength: {
                      value: 31,
                      message: "Pool name must be 31 characters or fewer",
                    },
                  })}
                  placeholder="Enter pool name"
                  className="w-full"
                />
                {errors.poolName && (
                  <p className="text-xs text-red-500">
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
                      required: "Price is required for fixed pools",
                      validate: (v) =>
                        Number(v) > 0 || "Price must be greater than 0",
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
                    <p className="text-xs text-red-500">
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
                    required: "Budget is required",
                    validate: (v) =>
                      Number(v) > 0 || "Budget must be greater than 0",
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
                  <p className="text-xs text-red-500">
                    {errors.budget.message}
                  </p>
                )}
              </div>

              {/* Claim Policy */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Claim Policy</label>
                <Controller
                  control={control}
                  name="claimPolicy"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value === "instant" ? "instant" : "after_end"}
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

              {/* Start Time */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Time</label>
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ required: "Start time is required" }}
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
                  <p className="text-xs text-red-500">
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
                  rules={{ required: "End time is required" }}
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
                  <p className="text-xs text-red-500">
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
              type: "submit",
              disabled: isSubmitting,
            }}
          />
        </div>
      </form>
    </div>
  );
}
