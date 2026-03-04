import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Field,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { useState, useMemo } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useCreateWhitelistUserSolanaFn } from "./useCreateWhitelistUserSolanaFn";
import { whitelistUserService } from "@/services/whitelistUserService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { isSolanaAddress, isEvmAddress } from "@/utils/helpers/address";
import { toast } from "sonner";

const baseSchema = {
    name: z.string().optional(),
    email: z.string().email({ error: "Invalid email address" }).optional().or(z.literal("")),
};

type WhitelistUserFormValues = z.infer<ReturnType<typeof buildSchema>>;

const buildSchema = (isSolana: boolean) =>
    z.object({
        ...baseSchema,
        walletAddress: z
            .string()
            .min(1, { error: "Wallet address is required" })
            .refine(
                (val) => (isSolana ? isSolanaAddress(val) : isEvmAddress(val)),
                {
                    error: isSolana
                        ? "Must be a valid Solana address"
                        : "Must be a valid EVM address (0x...)",
                },
            ),
    });


const AdminWhitelistUserDialogCreate = () => {
    const [open, setOpen] = useState<boolean>(false);
    const [isCallingSc, setIsCallingSc] = useState<boolean>(false);

    const { caipAddress } = useAppKitAccount();
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";

    const { createWhitelistUser: createWhitelistUserSolana } =
        useCreateWhitelistUserSolanaFn();

    const schema = useMemo(() => buildSchema(isSolana), [isSolana]);

    const { control, handleSubmit, reset } = useForm<WhitelistUserFormValues>({
        defaultValues: {
            name: "",
            email: "",
            walletAddress: "",
        },
        resolver: zodResolver(schema),
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset();
        }
        setOpen(open);
    };

    const onSubmit = async (data: WhitelistUserFormValues) => {
        if (isSolana) {
            setIsCallingSc(true);
            const result = await createWhitelistUserSolana({
                userAddress: data.walletAddress,
            });
            setIsCallingSc(false);
            if (!result) return;
        }

        // If at least one of name/email is filled, persist to backend
        const hasInfo = !!data.name?.trim() || !!data.email?.trim();
        if (hasInfo) {
            try {
                await whitelistUserService.updateUserInfo({
                    walletAddress: data.walletAddress.trim(),
                    name: data.name?.trim() || undefined,
                    email: data.email?.trim() || undefined,
                });
            } catch (error) {
                toast.error(getErrorMessage({ error }));
                return;
            }
        }

        handleOpenChange(false);
    };

    const isLoading = isCallingSc;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant={"mb-primary"} size={"mb-square-btn"}>
                    Add User <PlusIcon className="size-3.75" />
                </Button>
            </DialogTrigger>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-185.75"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>ADD USER TO WHITELIST</DialogTitle>
                    <DialogDescription>
                        Add a new user to the transfer whitelist
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-12.25" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3.75">
                        <Controller
                            control={control}
                            name="name"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Name
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="Alice Johnson"
                                        className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            control={control}
                            name="email"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Email
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder="alice@example.com"
                                        className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            control={control}
                            name="walletAddress"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Wallet Address<span className="text-md-required-red">*</span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        aria-invalid={fieldState.invalid}
                                        placeholder={
                                            isSolana
                                                ? "e.g. 9noXzpXnLLrrTn…"
                                                : "0x0000000000000000000000000000000000000000"
                                        }
                                        className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                    </div>

                    <div className="flex items-center justify-end">
                        <AnimateIconButton
                            variant="letter-icon"
                            iconLetter="C"
                            text="Cancel"
                            color="#FF8E8E"
                            textVariant="text-container-center"
                            classNames={{
                                btn: "bg-mb-cancel-gray sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive",
                            }}
                            btnProps={{
                                type: "reset",
                                onClick: () => handleOpenChange(false),
                                disabled: isLoading,
                            }}
                        />
                        <AnimateIconButton
                            variant="letter-icon"
                            iconLetter="A"
                            text={isLoading ? "Adding..." : "Add to Whitelist"}
                            color="#9072f9"
                            textVariant="text-self-center"
                            classNames={{
                                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                            }}
                            btnProps={{
                                type: "submit",
                                disabled: isLoading,
                            }}
                        />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminWhitelistUserDialogCreate;
