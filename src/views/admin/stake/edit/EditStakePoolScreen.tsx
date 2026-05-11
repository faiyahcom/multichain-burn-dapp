import { useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { NumericInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { poolService } from "@/services/poolService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useNavigate } from "@tanstack/react-router";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";
import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import { useEditStakePoolEvmFn } from "./useEditStakePoolEvmFn";
import { MIN_DAYS } from "../create/form";
import { useEditStakePoolSolFn } from "./useEditStakePoolSolFn";
import PoolOverview from "../detail/pool-overview";
import type { BurnPoolStatus } from "@/types/pool";

type EditStakeFormValues = {
    poolName: string;
    startTime: Date;
    endTime: Date;
    apr: string;
    lockDuration: string;
    interestStartDelay: string;
    interestAccrualDuration: string;
    claimStartDelay: string;
    minStakingAmount: string;
    maxStakingAmount: string;
    stakingLimit: string;
    interestStopDate: Date | undefined;
};

const STAKE_POOL_STATUS = {
    ...BURN_POOL_STATUS,
    live: { label: "Live", color: "#7af4cb", letter: "L" },
    end: { label: "End", color: "#A6B7FF", letter: "E" },
};

const secsToDays = (secs: string | undefined): string => {
    if (secs === undefined || secs === null) return "0";
    const n = Number(secs);
    if (!isFinite(n)) return "0";
    if (n <= 0) return "0";
    return String(n / 86400);
};

function formatDuration(seconds: number | undefined | null): string {
    if (seconds == null || !isFinite(seconds) || seconds < 0) return "—";
    if (seconds >= 9_007_199_254_740_991) return "Infinite";
    if (seconds === 0) return "0 days";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    return parts.length ? parts.join(" ") : `${seconds} seconds`;
}

const formatScheduleTime = (ts: string) =>
    format(new Date(Number(ts) * 1000), "MMM dd, yyyy, HH:mm") + " UTC";

export default function EditStakePoolScreen({
    poolAddress,
}: {
    poolAddress: string;
}) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const inFlightRef = useRef(false);
    const submitAttemptedRef = useRef(false);

    const { editPool: editPoolEvm } = useEditStakePoolEvmFn();
    const { editPool: editPoolSol } = useEditStakePoolSolFn();

    const { data: poolDetail, isLoading } = useQuery({
        queryKey: poolQueryKeys.detail(poolAddress),
        queryFn: () => poolService.getPoolDetail(poolAddress),
    });

    const pool = poolDetail?.pool;
    const stakePool = pool;
    const isSolana = pool?.chainId === SOLANA_BACKEND_CHAIN_ID;
    const safeStatus: BurnPoolStatus =
        (pool?.status as BurnPoolStatus) ?? "draft";
    const statusDisplay =
        STAKE_POOL_STATUS[safeStatus] ?? STAKE_POOL_STATUS["draft"];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        getValues,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EditStakeFormValues>({
        mode: "onChange",
        defaultValues: {
            poolName: "",
            apr: "",
            lockDuration: "",
            interestStartDelay: "",
            interestAccrualDuration: "",
            claimStartDelay: "",
            minStakingAmount: "",
            maxStakingAmount: "",
            stakingLimit: "",
            interestStopDate: undefined,
        },
    });

    // Pre-fill form once pool loads
    useEffect(() => {
        if (!pool) return;
        const aprDisplay =
            stakePool?.apr !== undefined
                ? String(Number(stakePool.apr) / DECIMAL_FEE_PERCENT)
                : "";
        reset({
            poolName: pool.name ?? "",
            startTime: new Date(Number(pool.timeStart) * 1000),
            endTime: new Date(Number(pool.timeEnd) * 1000),
            apr: aprDisplay,
            lockDuration: secsToDays(stakePool?.lockUpDuration),
            interestStartDelay: secsToDays(stakePool?.interestStartDelay),
            interestAccrualDuration:
                stakePool?.interestAccrualDuration &&
                    stakePool?.interestAccrualDuration !== "0"
                    ? secsToDays(stakePool?.interestAccrualDuration)
                    : "",
            claimStartDelay: secsToDays(stakePool?.claimStartDelay),
            minStakingAmount:
                stakePool?.minStakingAmount &&
                    stakePool.minStakingAmount !== "0" &&
                    pool.tokenInDecimals != null
                    ? sciToFormatted(stakePool.minStakingAmount, pool.tokenInDecimals)
                    : "",
            maxStakingAmount:
                stakePool?.maxStakingAmount &&
                    stakePool.maxStakingAmount !== "0" &&
                    pool.tokenInDecimals != null
                    ? sciToFormatted(stakePool.maxStakingAmount, pool.tokenInDecimals)
                    : "",
            stakingLimit:
                stakePool?.stakingLimit &&
                    stakePool.stakingLimit !== "0" &&
                    pool.tokenInDecimals != null
                    ? sciToFormatted(stakePool.stakingLimit, pool.tokenInDecimals)
                    : "",
            interestStopDate: stakePool?.interestStopDate && stakePool.interestStopDate !== "0"
                ? new Date(Number(stakePool.interestStopDate) * 1000)
                : undefined,
        });
    }, [pool?.address]); // eslint-disable-line react-hooks/exhaustive-deps

    const startTime = watch("startTime");
    const endTime = watch("endTime");
    const lockDurationVal = watch("lockDuration");
    const interestStartDelayVal = watch("interestStartDelay");
    const interestAccrualDurationVal = watch("interestAccrualDuration");
    const claimStartDelayVal = watch("claimStartDelay");
    const interestStopDateVal = watch("interestStopDate");

    const validInterestStopRange = useMemo(() => {
        const startSec = startTime ? startTime.getTime() / 1000 : null;
        const endSec = endTime ? endTime.getTime() / 1000 : null;
        if (!startSec || !endSec || endSec <= startSec) return null;
        const lockDays = Number(lockDurationVal) || 0;
        const interestDelayDays = Number(interestStartDelayVal) || 0;
        const interestAccrualDays =
            interestAccrualDurationVal && Number(interestAccrualDurationVal) > 0
                ? Number(interestAccrualDurationVal)
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
    }, [startTime, endTime, lockDurationVal, interestStartDelayVal, interestAccrualDurationVal, claimStartDelayVal]);

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
            interestAccrualDurationVal && Number(interestAccrualDurationVal) > 0
                ? Number(interestAccrualDurationVal)
                : null;
        const reasons: string[] = [];
        if (lockDays * 86400 <= D + interestDelayDays * 86400)
            reasons.push(`Lock-up Duration must be > ${D_days + interestDelayDays} days (pool duration ${D_days} + interest start delay ${interestDelayDays})`);
        if (claimDelayDays * 86400 <= D)
            reasons.push(`Claim Start Delay must be > ${D_days} days (pool duration)`);
        if (interestAccrualDays !== null && interestAccrualDays * 86400 <= D)
            reasons.push(`Interest Accrual Duration must be > ${D_days} days (pool duration)`);
        return reasons.length > 0 ? reasons : null;
    }, [validInterestStopRange, startTime, endTime, lockDurationVal, interestStartDelayVal, interestAccrualDurationVal, claimStartDelayVal]);

    const onSubmit = async (values: EditStakeFormValues) => {
        if (!pool || inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const startUnix = Math.floor(values.startTime.getTime() / 1000);
            const endUnix = Math.floor(values.endTime.getTime() / 1000);
            const apr = Number(values.apr) || 0;
            const lockDuration = Number(values.lockDuration) || 0;
            const interestStartDelay = Number(values.interestStartDelay) || 0;
            const claimStartDelay = Number(values.claimStartDelay) || 0;
            const interestAccrualDuration =
                values.interestAccrualDuration === "" ||
                    Number(values.interestAccrualDuration) <= 0
                    ? null
                    : Number(values.interestAccrualDuration);

            if (isSolana) {
                await editPoolSol({
                    poolAddress: pool.address,
                    name: values.poolName.trim(),
                    timeStart: startUnix,
                    timeEnd: endUnix,
                    minStakingAmount: values.minStakingAmount || "0",
                    maxStakingAmount: values.maxStakingAmount || "0",
                    stakingLimit: values.stakingLimit || "0",
                    lockDuration,
                    interestStartDelay,
                    interestAccrualDuration,
                    claimStartDelay,
                    apr,
                    tokenInDecimals: pool.tokenInDecimals,
                    interestStopDate: values.interestStopDate,
                });
            } else {
                await editPoolEvm({
                    poolAddress: pool.address,
                    name: values.poolName.trim(),
                    startTime: startUnix,
                    endTime: endUnix,
                    minStakingAmount: values.minStakingAmount || "0",
                    maxStakingAmount: values.maxStakingAmount || "0",
                    stakingLimit: values.stakingLimit || "0",
                    lockDuration,
                    interestStartDelay,
                    interestAccrualDuration,
                    claimStartDelay,
                    apr,
                    tokenInDecimals: pool.tokenInDecimals,
                    interestStopDate: values.interestStopDate,
                });
            }

            queryClient.invalidateQueries({
                queryKey: poolQueryKeys.detail(pool.address),
            });
            navigate({
                to: "/admin/stake/detail/$address",
                params: { address: pool.address },
            });
        } catch {
            // error handled in hooks
        } finally {
            inFlightRef.current = false;
        }
    };

    const fmtCurrentAmt = (raw: string | null | undefined) => {
        if (!raw || raw === "0" || pool?.tokenInDecimals == null)
            return "Unlimited";
        return formatAmount(raw, pool.tokenInDecimals);
    };

    if (isLoading || !pool) return <div className="p-8">Loading...</div>;

    const today = new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div className="p-4 pb-10 md:pt-9.5 md:pr-14 md:pl-14">
            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-1 lg:flex-row">
                <div className="space-y-1">
                    <h2 className="text-3xl font-semibold">Update Stake Pool</h2>
                    <p className="text-base text-greyed">
                        Update this staking pool's settings. Some fields may be restricted
                        once the pool is live.
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

            <form
                onSubmit={(e) => {
                    submitAttemptedRef.current = true;
                    handleSubmit(onSubmit)(e);
                }}
            >
                {/* ── Schedule ─────────────────────────────────────── */}
                <div className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {/* Current Schedule */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Current Schedule</span>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Start Time:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {formatScheduleTime(pool.timeStart)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">End Time:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {formatScheduleTime(pool.timeEnd)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Update Schedule */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Update Schedule</span>
                        </div>
                        <div className="grid grid-cols-1 gap-x-4 max-md:gap-y-2 md:grid-cols-2">
                            <div className="space-y-1">
                                <span className="text-base text-greyed">
                                    Start Time: <span className="text-destructive">*</span>
                                </span>
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
                            <div className="space-y-1">
                                <span className="text-base text-greyed">
                                    End Time: <span className="text-destructive">*</span>
                                </span>
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
                                        return (
                                            date < today || (startTime ? date < startTime : false)
                                        );
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
                                            if (v <= new Date())
                                                return "End time must be in the future";
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
                </div>

                {/* ── Pool Settings ─────────────────────────────────── */}
                <div className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {/* Current Settings */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Current Pool Settings</span>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Name:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {pool.name}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">APR:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {stakePool?.apr !== undefined
                                        ? `${shortenNumber({ number: Number(stakePool.apr) / DECIMAL_FEE_PERCENT, decimalPlaces: 2 })}%`
                                        : "—"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Lock-up Duration:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {formatDuration(Number(stakePool?.lockUpDuration))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">
                                    Interest Start Delay:
                                </span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {formatDuration(Number(stakePool?.interestStartDelay))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Interest Accrual:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {stakePool?.interestAccrualDuration === "0"
                                        ? "Unlimited"
                                        : formatDuration(Number(stakePool?.interestAccrualDuration))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Claim Start Delay:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {formatDuration(Number(stakePool?.claimStartDelay))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Interest Stop Date:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {stakePool?.interestStopDate && stakePool.interestStopDate !== "0"
                                        ? format(
                                            new Date(Number(stakePool.interestStopDate) * 1000),
                                            "MMM dd, yyyy, HH:mm",
                                        )
                                        : "Not set"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Min Staking Amount:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {fmtCurrentAmt(stakePool?.minStakingAmount)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Max Staking Amount:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {fmtCurrentAmt(stakePool?.maxStakingAmount)}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Staking Limit:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {fmtCurrentAmt(stakePool?.stakingLimit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Update Settings */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Update Pool Settings</span>
                        </div>
                        <div className="space-y-3">
                            {/* Pool Name */}
                            <div className="space-y-1">
                                <span className="text-base text-greyed">
                                    Pool Name: <span className="text-destructive">*</span>
                                </span>
                                <Input
                                    placeholder="Pool name"
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
                                    <p className="text-xs text-destructive">
                                        {errors.poolName.message}
                                    </p>
                                )}
                            </div>

                            {/* APR */}
                            <div className="space-y-1">
                                <span className="text-base text-greyed">
                                    APR (%): <span className="text-destructive">*</span>
                                </span>
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
                                {errors.apr && (
                                    <p className="text-xs text-destructive">
                                        {errors.apr.message}
                                    </p>
                                )}
                            </div>

                            {/* Durations row */}
                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Lock-up Duration (days):{" "}
                                        <span className="text-destructive">*</span>
                                    </span>
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
                                    {errors.lockDuration && (
                                        <p className="text-xs text-destructive">
                                            {errors.lockDuration.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Claim Start Delay (days):{" "}
                                        <span className="text-destructive">*</span>
                                    </span>
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
                                    {errors.claimStartDelay && (
                                        <p className="text-xs text-destructive">
                                            {errors.claimStartDelay.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Interest Stop Date */}
                            <div className="flex flex-col gap-1">
                                <span className="text-base text-greyed">Interest Stop Date:</span>
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
                                            const dayStart = date.getTime() / 1000;
                                            const dayEnd = dayStart + 86400;
                                            return dayEnd <= validInterestStopRange.lower || dayStart >= validInterestStopRange.upper;
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

                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Interest Start Delay (days):{" "}
                                        <span className="text-destructive">*</span>
                                    </span>
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
                                                    v === "" || Number(v) >= MIN_DAYS
                                                        ? true
                                                        : "Must be \u2265 0",
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
                                    {errors.interestStartDelay && (
                                        <p className="text-xs text-destructive">
                                            {errors.interestStartDelay.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Interest Accrual Duration (days):
                                    </span>
                                    <Controller
                                        control={control}
                                        name="interestAccrualDuration"
                                        rules={{
                                            validate: (v) =>
                                                !v || v === "" || Number(v) >= MIN_DAYS
                                                    ? true
                                                    : `Must be ≥ ${MIN_DAYS}`,
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
                                    {errors.interestAccrualDuration && (
                                        <p className="text-xs text-destructive">
                                            {errors.interestAccrualDuration.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Staking Amounts ───────────────────────────────── */}
                <div className="mt-3 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    {/* Labels */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Staking Amounts</span>
                        </div>
                        <p className="text-base text-greyed">
                            Enter amounts in token units (human-readable).
                        </p>
                    </div>

                    {/* Inputs */}
                    <div className="py-4">
                        <div className="flex items-center gap-2 pb-4">
                            <div className="h-1.5 w-1.5 bg-black" />
                            <span className="text-xl font-medium">Update Amounts</span>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Min Staking Amount:
                                    </span>
                                    <Controller
                                        control={control}
                                        name="minStakingAmount"
                                        rules={{
                                            validate: (v) => {
                                                if (!v) return true;
                                                if (Number(v) < 0) return "Must be \u2265 0";
                                                const max = Number(getValues("maxStakingAmount"));
                                                if (max && max > 0 && Number(v) > max)
                                                    return "Min staking amount must be \u2264 max staking amount";
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
                                    {errors.minStakingAmount && (
                                        <p className="text-xs text-destructive">
                                            {errors.minStakingAmount.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">
                                        Max Staking Amount:
                                    </span>
                                    <Controller
                                        control={control}
                                        name="maxStakingAmount"
                                        rules={{
                                            validate: (v) => {
                                                if (!v) return true;
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
                                    {errors.maxStakingAmount && (
                                        <p className="text-xs text-destructive">
                                            {errors.maxStakingAmount.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Staking Limit */}
                            <div className="space-y-1">
                                <span className="text-base text-greyed">Staking Limit:</span>
                                <Controller
                                    control={control}
                                    name="stakingLimit"
                                    rules={{
                                        validate: (v) => {
                                            if (!v) return true;
                                            if (Number(v) < 0) return "Must be \u2265 0";
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
                    </div>
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                <div className="mt-8 flex flex-col-reverse justify-end gap-4 sm:flex-row">
                    <AnimateIconButton
                        iconLetter="C"
                        text="Cancel"
                        variant="letter-icon"
                        textVariant="text-container-center"
                        classNames={{
                            btn: "sm:w-60 text-center after:text-xl after:text-primary-foreground after:bg-[#FF8E97]",
                            text: "text-xl font-medium",
                            icon: "size-7.5 text-xl",
                        }}
                        color="#FF8E97"
                        btnProps={{
                            type: "button",
                            disabled: isSubmitting,
                            onClick: () =>
                                navigate({
                                    to: "/admin/stake/detail/$address",
                                    params: { address: pool.address },
                                }),
                        }}
                    />
                    <AnimateIconButton
                        iconLetter="S"
                        text="Save Changes"
                        variant="letter-icon"
                        textVariant="text-container-center"
                        classNames={{
                            btn: "sm:w-60 text-center after:text-xl after:bg-[#966EFF] after:text-primary-foreground border border-active",
                            text: "text-xl font-medium",
                            icon: "size-7.5 text-xl",
                        }}
                        color="#966EFF"
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
