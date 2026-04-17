import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { poolService } from "@/services/poolService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/components/common/custom-toast";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import { BURN_POOL_STATUS } from "@/types/admin/whitelist-token";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";
import { useEditStakePoolEvmFn } from "./useEditStakePoolEvmFn";
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
};

const STAKE_POOL_STATUS = {
    ...BURN_POOL_STATUS,
    live: { label: "Live", color: "#7af4cb", letter: "L" },
    end: { label: "End", color: "#A6B7FF", letter: "E" },
};

const secsToDays = (secs: string | undefined): string => {
    if (!secs) return "";
    const n = Number(secs);
    if (!isFinite(n) || n <= 0) return "0";
    return String(n / 86400);
};

const formatScheduleTime = (ts: string) =>
    format(new Date(Number(ts) * 1000), "MMM dd, yyyy, HH:mm") + " UTC";

export default function EditStakePoolScreen({ poolAddress }: { poolAddress: string }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const inFlightRef = useRef(false);

    const { editPool: editPoolEvm } = useEditStakePoolEvmFn();
    const { editPool: editPoolSol } = useEditStakePoolSolFn();

    const { data: poolDetail, isLoading } = useQuery({
        queryKey: poolQueryKeys.detail(poolAddress),
        queryFn: () => poolService.getPoolDetail(poolAddress),
    });

    const pool = poolDetail?.pool;
    const stakePool = pool as any;
    const isSolana = pool?.chainId === SOLANA_BACKEND_CHAIN_ID;
    const safeStatus: BurnPoolStatus = (pool?.status as BurnPoolStatus) ?? "draft";
    const statusDisplay = STAKE_POOL_STATUS[safeStatus] ?? STAKE_POOL_STATUS["draft"];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<EditStakeFormValues>({
        defaultValues: {
            poolName: "",
            apr: "",
            lockDuration: "",
            interestStartDelay: "",
            interestAccrualDuration: "",
            claimStartDelay: "",
            minStakingAmount: "0",
            maxStakingAmount: "0",
            stakingLimit: "0",
        },
    });

    // Pre-fill form once pool loads
    useEffect(() => {
        if (!pool) return;
        const aprDisplay = stakePool?.apr !== undefined
            ? String(Number(stakePool.apr) / DECIMAL_FEE_PERCENT)
            : "";
        reset({
            poolName: pool.name ?? "",
            startTime: new Date(Number(pool.timeStart) * 1000),
            endTime: new Date(Number(pool.timeEnd) * 1000),
            apr: aprDisplay,
            lockDuration: secsToDays(stakePool?.lockUpDuration),
            interestStartDelay: secsToDays(stakePool?.interestStrartDelay),
            interestAccrualDuration: secsToDays(stakePool?.interestAccrualDuration),
            claimStartDelay: secsToDays(stakePool?.claimStartDelay),
            minStakingAmount: "0",
            maxStakingAmount: "0",
            stakingLimit: "0",
        });
    }, [pool?.address]); // eslint-disable-line react-hooks/exhaustive-deps

    const startTime = watch("startTime");
    const endTime = watch("endTime");

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
                values.interestAccrualDuration === "" || Number(values.interestAccrualDuration) <= 0
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
                    lockDuration,
                    interestStartDelay,
                    claimStartDelay,
                    apr,
                    tokenInDecimals: pool.tokenInDecimals,
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
                });
            }

            queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(pool.address) });
            navigate({ to: "/admin/stake/detail/$address", params: { address: pool.address } });
        } catch {
            // error handled in hooks
        } finally {
            inFlightRef.current = false;
        }
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
                        Update this staking pool's settings. Some fields may be restricted once the pool is live.
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
                                <span className="text-base text-greyed">Start Time:</span>
                                <DatePicker
                                    value={startTime}
                                    onChange={(d) => d && setValue("startTime", d)}
                                    disabled={(d) => d < today}
                                />
                                <input
                                    type="hidden"
                                    {...register("startTime", { required: "Start time is required" })}
                                />
                                {errors.startTime && (
                                    <p className="text-xs text-destructive">{errors.startTime.message}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <span className="text-base text-greyed">End Time:</span>
                                <DatePicker
                                    value={endTime}
                                    onChange={(d) => d && setValue("endTime", d)}
                                    disabled={(d) =>
                                        d < today || (startTime ? d < startTime : false)
                                    }
                                />
                                <input
                                    type="hidden"
                                    {...register("endTime", {
                                        required: "End time is required",
                                        validate: (v) =>
                                            !startTime || v > startTime
                                                ? true
                                                : "End time must be after start time",
                                    })}
                                />
                                {errors.endTime && (
                                    <p className="text-xs text-destructive">{errors.endTime.message}</p>
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
                                <span className="text-xl text-black max-sm:text-right">{pool.name}</span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">APR:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {stakePool?.apr !== undefined
                                        ? `${(Number(stakePool.apr) / DECIMAL_FEE_PERCENT).toFixed(2)}%`
                                        : "—"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Lock-up Duration:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {Number(stakePool?.lockUpDuration) / 86400 || "—"} days
                                </span>
                            </div>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Interest Start Delay:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {Number(stakePool?.interestStrartDelay) / 86400 || "—"} days
                                </span>
                            </div>
                            {!isSolana && (
                                <div className="grid grid-cols-2">
                                    <span className="text-xl text-greyed">Interest Accrual:</span>
                                    <span className="text-xl text-black max-sm:text-right">
                                        {Number(stakePool?.interestAccrualDuration) / 86400 || "—"} days
                                    </span>
                                </div>
                            )}
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">Claim Start Delay:</span>
                                <span className="text-xl text-black max-sm:text-right">
                                    {Number(stakePool?.claimStartDelay) / 86400 || "—"} days
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
                                <span className="text-base text-greyed">Pool Name:</span>
                                <Input
                                    placeholder="Pool name"
                                    aria-invalid={!!errors.poolName}
                                    {...register("poolName", {
                                        validate: (v) =>
                                            v.trim().length >= 3 ? true : "At least 3 characters required",
                                    })}
                                />
                                {errors.poolName && (
                                    <p className="text-xs text-destructive">{errors.poolName.message}</p>
                                )}
                            </div>

                            {/* APR */}
                            <div className="space-y-1">
                                <span className="text-base text-greyed">APR (%):</span>
                                <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="e.g. 12"
                                    aria-invalid={!!errors.apr}
                                    {...register("apr", {
                                        required: "APR is required",
                                        validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                    })}
                                />
                                {errors.apr && (
                                    <p className="text-xs text-destructive">{errors.apr.message}</p>
                                )}
                            </div>

                            {/* Durations row */}
                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">Lock-up Duration (days):</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0"
                                        {...register("lockDuration", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.lockDuration && (
                                        <p className="text-xs text-destructive">{errors.lockDuration.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">Claim Start Delay (days):</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0"
                                        {...register("claimStartDelay", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.claimStartDelay && (
                                        <p className="text-xs text-destructive">{errors.claimStartDelay.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3">
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">Interest Start Delay (days):</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0"
                                        {...register("interestStartDelay", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.interestStartDelay && (
                                        <p className="text-xs text-destructive">{errors.interestStartDelay.message}</p>
                                    )}
                                </div>
                                {!isSolana && (
                                    <div className="space-y-1">
                                        <span className="text-base text-greyed">Interest Accrual Duration (days):</span>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="any"
                                            placeholder="0 = infinite"
                                            {...register("interestAccrualDuration", {
                                                validate: (v) =>
                                                    v === "" || Number(v) >= 0 ? true : "Must be ≥ 0",
                                            })}
                                        />
                                        {errors.interestAccrualDuration && (
                                            <p className="text-xs text-destructive">
                                                {errors.interestAccrualDuration.message}
                                            </p>
                                        )}
                                    </div>
                                )}
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
                            {isSolana && (
                                <span className="block mt-1">
                                    Note: Staking Limit is not updatable on Solana.
                                </span>
                            )}
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
                                    <span className="text-base text-greyed">Min Staking Amount:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0.00"
                                        aria-invalid={!!errors.minStakingAmount}
                                        {...register("minStakingAmount", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.minStakingAmount && (
                                        <p className="text-xs text-destructive">
                                            {errors.minStakingAmount.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">Max Staking Amount:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0.00 (unlimited)"
                                        aria-invalid={!!errors.maxStakingAmount}
                                        {...register("maxStakingAmount", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.maxStakingAmount && (
                                        <p className="text-xs text-destructive">
                                            {errors.maxStakingAmount.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isSolana && (
                                <div className="space-y-1">
                                    <span className="text-base text-greyed">Staking Limit:</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0.00 (unlimited)"
                                        aria-invalid={!!errors.stakingLimit}
                                        {...register("stakingLimit", {
                                            validate: (v) => (Number(v) >= 0 ? true : "Must be ≥ 0"),
                                        })}
                                    />
                                    {errors.stakingLimit && (
                                        <p className="text-xs text-destructive">
                                            {errors.stakingLimit.message}
                                        </p>
                                    )}
                                </div>
                            )}
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
