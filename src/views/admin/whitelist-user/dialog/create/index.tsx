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
import { useState } from "react";
import { toast } from "sonner";

const whitelistUserSchema = z.object({
    name: z.string().min(1, { error: "Name is required" }),
    email: z.string().email({ error: "Invalid email address" }),
    walletAddress: z.string().min(1, { error: "Wallet address is required" }),
    description: z.string().optional(),
});

type WhitelistUserFormValues = z.infer<typeof whitelistUserSchema>;

const AdminWhitelistUserDialogCreate = () => {
    const [open, setOpen] = useState<boolean>(false);

    const { control, handleSubmit, reset } = useForm<WhitelistUserFormValues>({
        defaultValues: {
            name: "",
            email: "",
            walletAddress: "",
            description: "",
        },
        resolver: zodResolver(whitelistUserSchema),
    });

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            reset();
        }
        setOpen(open);
    };

    const onSubmit = async (_data: WhitelistUserFormValues) => {
        // TODO: wire up to actual API
        toast.success("User whitelisted successfully!");
        handleOpenChange(false);
    };

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
                                        Name<span className="text-md-required-red">*</span>
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
                                        Email<span className="text-md-required-red">*</span>
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
                                        placeholder="0x0000000000000000000000000000000000000000"
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
                            }}
                        />
                        <AnimateIconButton
                            variant="letter-icon"
                            iconLetter="A"
                            text="Add to Whitelist"
                            color="#9072f9"
                            textVariant="text-self-center"
                            classNames={{
                                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                            }}
                            btnProps={{
                                type: "submit",
                            }}
                        />
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminWhitelistUserDialogCreate;
