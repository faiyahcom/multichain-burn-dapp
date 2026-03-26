import AnimateIconButton from "@/components/common/animate-icon-button";
import NetworkImgIcon from "@/components/common/network-img-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useSystemStore } from "@/stores/systemStore";
import {
  adminManagementRoleLabels,
  adminManagementRoles,
} from "@/types/admin/admin-management";
import { isSupportedWalletAddress } from "@/utils/helpers/address";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const networkIdValues = NETWORK_CONFIGS.map((x) => x.id);

const adminManagementFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Full name is required" }),
  email: z.email({ error: "Invalid email address" }),
  walletAddress: z
    .string()
    .trim()
    .min(1, { error: "Wallet address is required" })
    .refine(
      (value) => isSupportedWalletAddress(value),
      "Must be a valid EVM or Solana wallet address",
    ),
  networkId: z.enum(networkIdValues),
  role: z.enum(adminManagementRoles),
});

export type AdminManagementFormValues = z.infer<
  typeof adminManagementFormSchema
>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  defaultValues?: Partial<AdminManagementFormValues>;
  submitText?: string;
  isLoading?: boolean;
  lockWalletAddress?: boolean;
  lockNetworkId?: boolean;
  lockRole?: boolean;
  onSubmit: (values: AdminManagementFormValues) => Promise<void> | void;
}

const resolveDefaultValues = (
  defaultValues?: Partial<AdminManagementFormValues>,
): AdminManagementFormValues => ({
  name: defaultValues?.name ?? "",
  email: defaultValues?.email ?? "",
  walletAddress: defaultValues?.walletAddress ?? "",
  networkId: defaultValues?.networkId ?? "ethereumTestnet",
  role: defaultValues?.role ?? "super_admin",
});

const AdminManagementDialogForm: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  description,
  defaultValues,
  submitText = "Save Changes",
  isLoading,
  lockWalletAddress,
  lockNetworkId,
  lockRole,
  onSubmit,
}) => {
  const currentNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const openSwitchNetworkModal = useSystemStore(
    (state) => state.openSwitchNetworkModal,
  );
  const { control, handleSubmit, reset, setValue } =
    useForm<AdminManagementFormValues>({
      defaultValues: resolveDefaultValues(defaultValues),
      resolver: zodResolver(adminManagementFormSchema),
    });

  useEffect(() => {
    reset(resolveDefaultValues(defaultValues));
  }, [defaultValues, open, reset]);

  useEffect(() => {
    if (!lockNetworkId && currentNetworkId) {
      setValue("networkId", currentNetworkId);
    }
  }, [currentNetworkId, lockNetworkId, setValue]);

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset(resolveDefaultValues(defaultValues));
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-140"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="gap-1">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form
          className="space-y-10"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
        >
          <div className="space-y-3.75">
            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Full Name
                    <span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Uniswap"
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
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
                    <span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="john@example.com"
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="walletAddress"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Wallet Address
                    <span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    disabled={lockWalletAddress}
                    placeholder="0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"
                    className="px-5 placeholder:text-15px placeholder:text-secondary-text disabled:opacity-60"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="networkId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-3.25">
                  <FieldLabel htmlFor={field.name}>
                    Network<span className="text-md-required-red">*</span>
                  </FieldLabel>
                  <div className="flex items-center gap-2.25">
                    {NETWORK_CONFIGS.map((network, index) => (
                      <AnimateIconButton
                        key={index}
                        variant="external-icon"
                        icon={({ className }) => (
                          <NetworkImgIcon
                            src={network.iconSrc}
                            alt={network.label}
                            className={className}
                          />
                        )}
                        isActive={field.value === network.id}
                        btnProps={{
                          disabled: lockNetworkId || isLoading,
                          onClick: () => {
                            field.onChange(network.id);

                            if (
                              !lockNetworkId &&
                              currentNetworkId !== network.id
                            ) {
                              openSwitchNetworkModal(
                                currentNetworkId,
                                network.id,
                              );
                            }
                          },
                        }}
                        text={network.label}
                        color={network.color}
                        classNames={{
                          btn: "after:text-primary-foreground",
                        }}
                      />
                    ))}
                  </div>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="role"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Role
                    <span className="text-md-required-red">*</span>
                  </FieldLabel>
                  {lockRole ? (
                    <Input
                      id={field.name}
                      value={adminManagementRoleLabels[field.value]}
                      disabled
                      className="px-5 disabled:opacity-60"
                    />
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        id={field.name}
                        className="h-9 w-full rounded-md-plus border-none bg-inactive px-5 text-base text-foreground shadow-none"
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-mb-popover">
                        {adminManagementRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {adminManagementRoleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-5">
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="C"
              text="Cancel"
              color="#FF8E8E"
              textVariant="text-container-center"
              classNames={{
                btn: "border border-inactive bg-mb-cancel-gray sm:min-w-50 sm:px-2.25 sm:py-4.25",
              }}
              btnProps={{
                type: "button",
                onClick: () => handleDialogOpenChange(false),
                disabled: isLoading,
              }}
            />
            <AnimateIconButton
              variant="letter-icon"
              iconLetter="S"
              text={submitText}
              color="#9072F9"
              textVariant="text-self-center"
              classNames={{
                btn: "border border-mb-submit-border sm:min-w-55 sm:px-2.25 sm:py-4.25",
              }}
              isLoading={isLoading}
              isLoadingText="Saving..."
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

export default AdminManagementDialogForm;
