import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useAppKitAccount } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useCreateSwapPoolSolanaFn } from "@/views/swap-pool/create/useCreateSwapPoolSolanaFn";
import { useCreateSwapPoolEvmFn } from "../useCreateSwapPoolEvmFn";
import { IconS } from "@/assets/react";
import { useSystemStore } from "@/stores/systemStore";
import { NETWORK_CONFIGS } from "@/config/networks";
import { toast } from "sonner";

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

    const { createPool: createPoolSolana } = useCreateSwapPoolSolanaFn();
    const { createPool: createPoolEvm } = useCreateSwapPoolEvmFn();

    const {
        register,
        control,
        handleSubmit,
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
            await createPoolSolana({
                rewardMint: new PublicKey(values.tokenReward),
                depositMint: new PublicKey(values.tokenBurn),
                rewardAmount: Number(values.budget),
                name: values.poolName,
                ratioNumerator,
                ratioDenominator,
            });
            return;
        }

        if (isEvm && !onSubmitForm) {
            await createPoolEvm({
                poolName: values.poolName,
                tokenReward: values.tokenReward,
                tokenIn: values.tokenBurn,
                rewardAmount: Number(values.budget),
                ratioNumerator,
                ratioDenominator,
            });
            return;
        }

        if (onSubmitForm) {
            onSubmitForm(values);
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
                    {...register("poolName", { required: "Pool name is required" })}
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
                        <Controller
                            name="tokenBurn"
                            control={control}
                            rules={{ required: "Token burn is required" }}
                            render={({ field }) => (
                                // <Select
                                //     value={field.value}
                                //     onValueChange={field.onChange}
                                //     defaultValue={field.value}
                                // >
                                //     <SelectTrigger aria-invalid={!!errors.tokenBurn}>
                                //         <SelectValue placeholder="Select Token" />
                                //     </SelectTrigger>
                                //     <SelectContent>
                                //         <SelectItem value="1">1</SelectItem>
                                //     </SelectContent>
                                // </Select>
                                <Input
                                    placeholder="Enter Token Burn"
                                    aria-invalid={!!errors.tokenBurn}
                                    {...field}
                                />
                            )}
                        />
                        {errors.tokenBurn && (
                            <p className="text-xs text-destructive">
                                {errors.tokenBurn.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <span className="text-[13px]">Ratio</span>
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
                        <div className="flex flex-col gap-2">
                            <span className="text-[13px]">Token Reward</span>
                            <Controller
                                name="tokenReward"
                                control={control}
                                rules={{ required: "Reward token is required" }}
                                render={({ field }) => (
                                    // <Select
                                    //     value={field.value}
                                    //     onValueChange={field.onChange}
                                    //     defaultValue={field.value}
                                    // >
                                    //     <SelectTrigger aria-invalid={!!errors.tokenReward}>
                                    //         <SelectValue placeholder="Select Token" />
                                    //     </SelectTrigger>
                                    //     <SelectContent>
                                    //         <SelectItem value="1">1</SelectItem>
                                    //     </SelectContent>
                                    // </Select>
                                    <Input
                                        placeholder="Enter Token Reward"
                                        aria-invalid={!!errors.tokenReward}
                                        {...field}
                                        className="w-md"
                                    />
                                )}
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
                        <div className="flex gap-2 rounded-md-plus bg-inactive px-14 py-1 text-[15px] text-nowrap">
                            {NETWORK_CONFIGS.find((n) => n.id === selectedNetworkId)?.label ||
                                "Unknown Network"}
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
                    <Button
                        type="submit"
                        variant="ghost"
                        className="relative h-12 w-76.25 cursor-pointer justify-self-center rounded-sm border border-inactive bg-transparent text-xl font-medium transition-all"
                        disabled={isSubmitting}
                    >
                        <IconS className="absolute left-4 size-8" />
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export default CreateSwapPoolForm;
