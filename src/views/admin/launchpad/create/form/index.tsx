import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { useAppKitAccount } from "@reown/appkit/react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import AnimateIconButton from "@/components/common/animate-icon-button";
import WhitelistTokenSelect from "@/components/common/whitelist-token-select";
import { DatePicker } from "@/components/ui/date-picker";
import { NumericInput } from "@/components/ui/numeric-input";
import { InputGroup } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import BlueSwitch from "@/components/common/blue-switch";
import NetworkIcon from "@/components/layout/header/network-icon";
import { useCreateLaunchpadPoolSolFn } from "../useCreateLaunchpadPoolSolFn";
import { useCreateLaunchpadPoolEvmFn } from "../useCreateLaunchpadPoolEvmFn";
import { shortenNumber } from "@/utils/helpers/numbers";

type ClaimPolicy = "instant" | "after_end_auto" | "after_end_claim";

type CreateLaunchpadPoolFormValues = {
    poolName: string;
    startTime: Date;
    endTime: Date;
    mode: "fixed" | "dynamic";
    price: string;
    saleToken: string;
    paymentToken: string;
    claimPolicy: ClaimPolicy;
    rewardVisibility: boolean;
    budget: string;
};

const CreateLaunchpadPoolForm = () => {
    const navigate = useNavigate();
    const { caipAddress } = useAppKitAccount();
    const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";

    const { createPool: createPoolSol } = useCreateLaunchpadPoolSolFn();
    const { createPool: createPoolEvm } = useCreateLaunchpadPoolEvmFn();

    const inFlightRef = useRef(false);
    const submitAttemptedRef = useRef(false);
    const submitActionRef = useRef<"draft" | "submit">("submit");

    const network = NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control,
        formState: { errors, isSubmitting },
    } = useForm<CreateLaunchpadPoolFormValues>({
        mode: "onChange",
        defaultValues: {
            poolName: "",
            startTime: undefined,
            endTime: undefined,
            mode: "dynamic",
            price: "",
            saleToken: "",
            paymentToken: "",
            claimPolicy: "after_end_claim",
            rewardVisibility: true,
            budget: "",
        },
    });

    const mode = watch("mode");
    const saleToken = watch("saleToken");
    const paymentToken = watch("paymentToken");
    const startTime = watch("startTime");
    const endTime = watch("endTime");
    const claimPolicy = watch("claimPolicy");
    const price = watch("price");
    const budget = watch("budget");

    const isFixed = mode === "fixed";
    const isDynamic = mode === "dynamic";

    const totalTargetRaised =
        isFixed && Number(price) > 0 && Number(budget) > 0
            ? Number(price) * Number(budget)
            : null;

    const onSubmit: SubmitHandler<CreateLaunchpadPoolFormValues> = async (
        values,
    ) => {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const isDraft = submitActionRef.current === "draft";
            const params = {
                poolName: values.poolName.trim(),
                saleToken: values.saleToken,
                paymentToken: values.paymentToken,
                startTime: values.startTime,
                endTime: values.endTime,
                mode: values.mode,
                price: values.price,
                claimPolicy: values.claimPolicy,
                budget: values.budget,
                rewardVisibility: values.rewardVisibility,
            };

            let poolAddress: string | undefined;
            if (isSolana) {
                poolAddress = await createPoolSol({ ...params, isDraft });
            } else {
                poolAddress = await createPoolEvm({ ...params, isDraft });
            }

            if (poolAddress) {
                reset();
                navigate({
                    to: "/admin/launchpad/detail/$address",
                    params: { address: poolAddress },
                });
            }
        } finally {
            inFlightRef.current = false;
        }
    };

    return (
        <form
            className="w-full max-w-xl space-y-6"
            onSubmit={handleSubmit(onSubmit)}
        >
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

            {/* Pool Period */}
            <div className="flex flex-col gap-3">
                <span className="text-xl font-medium">Pool Period</span>
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

            {/* Mode */}
            <div className="flex flex-col gap-3">
                <span className="text-xl font-medium">Mode</span>
                <Controller
                    control={control}
                    name="mode"
                    render={({ field }) => (
                        <RadioGroup
                            value={field.value}
                            onValueChange={(val) => {
                                field.onChange(val as "fixed" | "dynamic");
                                if (val === "dynamic" && claimPolicy === "instant") {
                                    setValue("claimPolicy", "after_end_claim");
                                }
                            }}
                            className="gap-2.5"
                        >
                            <RadioGroupItem value="fixed">
                                <span>Fixed</span>
                            </RadioGroupItem>
                            <RadioGroupItem value="dynamic">
                                <span>Dynamic</span>
                            </RadioGroupItem>
                        </RadioGroup>
                    )}
                />

                {/* Price — Fixed mode only */}
                {isFixed && (
                    <div className="flex flex-col gap-2">
                        <span className="text-[13px]">Price</span>
                        <Controller
                            control={control}
                            name="price"
                            rules={{
                                validate: (v) => {
                                    if (!isFixed) return true;
                                    if (!v || v === "")
                                        return submitAttemptedRef.current
                                            ? "Price is required for Fixed mode"
                                            : true;
                                    if (Number(v) <= 0) return "Price must be greater than 0";
                                    return true;
                                },
                            }}
                            render={({ field }) => (
                                <NumericInput
                                    placeholder="0.0"
                                    aria-invalid={!!errors.price}
                                    value={field.value}
                                    onChange={field.onChange}
                                    ref={field.ref}
                                    name={field.name}
                                    onBlur={field.onBlur}
                                    className="w-full max-w-48"
                                />
                            )}
                        />
                        {errors.price && (
                            <p className="text-xs text-destructive">{errors.price.message}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Asset */}
            <div className="flex flex-col gap-3">
                <span className="text-xl font-medium">Asset</span>
                <div className="flex gap-6">
                    {/* Sale Token */}
                    <div className="flex flex-1 flex-col gap-1.5">
                        <span className="text-[13px]">
                            Sale Token <span className="text-destructive">*</span>
                        </span>
                        <WhitelistTokenSelect
                            value={saleToken}
                            onChange={(addr) =>
                                setValue("saleToken", addr, { shouldValidate: true })
                            }
                            disabledAddress={paymentToken}
                            poolKind={3}
                        />
                        <input
                            type="hidden"
                            {...register("saleToken", {
                                validate: (v) =>
                                    !submitAttemptedRef.current || !!v
                                        ? true
                                        : "Sale token is required",
                            })}
                        />
                        {errors.saleToken && (
                            <p className="text-xs text-destructive">
                                {errors.saleToken.message}
                            </p>
                        )}
                    </div>

                    {/* Payment Token */}
                    <div className="flex flex-1 flex-col gap-1.5">
                        <span className="text-[13px]">
                            Payment Token <span className="text-destructive">*</span>
                        </span>
                        <WhitelistTokenSelect
                            value={paymentToken}
                            onChange={(addr) =>
                                setValue("paymentToken", addr, { shouldValidate: true })
                            }
                            disabledAddress={saleToken}
                            poolKind={3}
                        />
                        <input
                            type="hidden"
                            {...register("paymentToken", {
                                validate: (v) =>
                                    !submitAttemptedRef.current || !!v
                                        ? true
                                        : "Payment token is required",
                            })}
                        />
                        {errors.paymentToken && (
                            <p className="text-xs text-destructive">
                                {errors.paymentToken.message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Claim Policy */}
            <div className="flex flex-col gap-3">
                <span className="text-xl font-medium">Claim Policy</span>

                {/* Top-level: Instant or After End */}
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
                            className="flex w-fit flex-col gap-2.5"
                        >
                            {!isDynamic && (
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

                {/* After End sub-options */}
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
                                onValueChange={(val) => field.onChange(val as ClaimPolicy)}
                                className="ml-5 flex w-fit flex-col"
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

            {/* Reward Visibility — Dynamic mode only */}
            {isDynamic && (
                <div className="flex items-center gap-3">
                    <span className="font-medium">Reward Visibility</span>
                    <div className="flex items-center gap-3">
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
                </div>
            )}

            {/* Deposit Sale Token (Budget) */}
            <div className="flex flex-col gap-3">
                <span className="text-xl font-medium">Deposit Sale Token</span>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[13px]">Budget</span>
                    <InputGroup className="h-fit w-full max-w-xs">
                        <Controller
                            control={control}
                            name="budget"
                            rules={{
                                validate: (v) => {
                                    if (!v || v === "")
                                        return submitAttemptedRef.current
                                            ? "Budget is required"
                                            : true;
                                    if (Number(v) <= 0) return "Budget must be greater than 0";
                                    return true;
                                },
                            }}
                            render={({ field }) => (
                                <NumericInput
                                    placeholder="0.0"
                                    aria-invalid={!!errors.budget}
                                    value={field.value}
                                    onChange={field.onChange}
                                    ref={field.ref}
                                    name={field.name}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </InputGroup>
                    {errors.budget && (
                        <p className="text-xs text-destructive">{errors.budget.message}</p>
                    )}
                </div>
                {/* Total Target Raised — Fixed pools only */}
                {isFixed && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[13px]">Total Target Raised</span>
                        <Input
                            type="text"
                            readOnly
                            value={shortenNumber({ number: totalTargetRaised ?? 0 })}
                            className="max-w-xs"
                        />
                    </div>
                )}
            </div>

            {/* Network info */}
            <div className="flex items-center gap-6">
                <span className="text-xl font-medium">Network</span>
                <div className="relative flex gap-2 rounded-md-plus bg-inactive px-14 py-1 text-[15px] text-nowrap">
                    <NetworkIcon
                        networkId={network?.id || ("" as NetworkId)}
                        className="absolute left-4"
                    />
                    <span>{network?.label}</span>
                </div>
            </div>

            {/* Action Buttons */}
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
                            navigate({ to: "/admin/draft-pools" });
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

export default CreateLaunchpadPoolForm;
