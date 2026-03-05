import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { whitelistUserService } from "@/services/whitelistUserService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toast } from "sonner";
import type { WhitelistUser } from "@/services/whitelistUserService";

const editUserSchema = z.object({
    name: z.string().optional(),
    email: z
        .string()
        .email({ error: "Invalid email address" })
        .optional()
        .or(z.literal("")),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface Props {
    user: WhitelistUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AdminWhitelistUserDialogEdit: React.FC<Props> = ({
    user,
    open,
    onOpenChange,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit, reset } = useForm<EditUserFormValues>({
        defaultValues: {
            name: user.name ?? "",
            email: user.email ?? "",
        },
        resolver: zodResolver(editUserSchema),
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) reset({ name: user.name ?? "", email: user.email ?? "" });
        onOpenChange(open);
    };

    const onSubmit = async (data: EditUserFormValues) => {
        const hasInfo = !!data.name?.trim() || !!data.email?.trim();
        if (!hasInfo) {
            handleOpenChange(false);
            return;
        }

        setIsLoading(true);
        try {
            await whitelistUserService.updateUserInfo({
                walletAddress: user.address,
                name: data.name?.trim() || undefined,
                email: data.email?.trim() || undefined,
            });
            toast.success("User info updated successfully!");
            handleOpenChange(false);
        } catch (error) {
            toast.error(getErrorMessage({ error }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-185.75"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>EDIT USER INFO</DialogTitle>
                    <DialogDescription>
                        Update the name or email for this whitelisted user
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-12.25" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3.75">
                        {/* Wallet address — disabled / read-only */}
                        <Field>
                            <FieldLabel>Wallet Address</FieldLabel>
                            <Input
                                value={user.address}
                                disabled
                                className="px-5 opacity-60 cursor-not-allowed"
                            />
                        </Field>

                        <Controller
                            control={control}
                            name="name"
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
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
                                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
                            iconLetter="S"
                            text={isLoading ? "Saving..." : "Save Changes"}
                            color="#9072f9"
                            textVariant="text-self-center"
                            classNames={{
                                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border ml-5",
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

export default AdminWhitelistUserDialogEdit;
