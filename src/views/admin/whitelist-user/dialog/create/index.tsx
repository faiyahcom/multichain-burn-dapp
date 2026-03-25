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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AnimateIconButton from "@/components/common/animate-icon-button";
import NetworkImgIcon from "@/components/common/network-img-icon";
import { useState, useEffect, useCallback } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useCreateWhitelistUserSolanaFn } from "./useCreateWhitelistUserSolanaFn";
import { useCreateWhitelistUserEvmFn } from "./useCreateWhitelistUserEvmFn";
import { whitelistUserService } from "@/services/whitelistUserService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { isSolanaAddress, isEvmAddress } from "@/utils/helpers/address";
import { toast } from "@/components/common/custom-toast";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { useQueryClient } from "@tanstack/react-query";
import { whitelistUserQueryKeys } from "@/services/queries/queryKey";
import { useAdminWhitelistUserSearchFilterStore } from "@/stores/admin/whitelist-user/search-filter-store";

const networkIdValues = [
    "ethereumTestnet",
    "binanceTestnet",
    "xphereTestnet",
    "solanaDevnet",
] as const satisfies [NetworkId, ...NetworkId[]];

const whitelistUserSchema = z.object({
    networkId: z.enum(networkIdValues),
    walletAddress: z.string().min(1, { error: "Wallet address is required" }),
    name: z.string().optional(),
    email: z
        .string()
        .email({ error: "Invalid email address" })
        .optional()
        .or(z.literal("")),
});

type WhitelistUserFormValues = z.infer<typeof whitelistUserSchema>;

const AdminWhitelistUserDialogCreate = () => {
    const [open, setOpen] = useState(false);
    const [isCallingSc, setIsCallingSc] = useState(false);

    const { caipAddress } = useAppKitAccount();
    const { open: openAppKit } = useAppKit();
    const { openSwitchNetworkModal } = useSystemStore();
    const [namespace, chainRef] = caipAddress?.split(":") ?? [];
    const isSolana = namespace === "solana";
    const isEvm = namespace === "eip155";
    const currentNetworkId =
        namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

    const { createWhitelistUser: createSolana } = useCreateWhitelistUserSolanaFn();
    const { createWhitelistUser: createEvm } = useCreateWhitelistUserEvmFn();

    const queryClient = useQueryClient();
    const { filter } = useAdminWhitelistUserSearchFilterStore();

    const { control, handleSubmit, reset, setValue } =
        useForm<WhitelistUserFormValues>({
            defaultValues: {
                networkId: "ethereumTestnet",
                walletAddress: "",
                name: "",
                email: "",
            },
            resolver: zodResolver(whitelistUserSchema),
        });

    // Sync form field whenever the wallet switches network
    useEffect(() => {
        if (currentNetworkId) setValue("networkId", currentNetworkId);
    }, [currentNetworkId, setValue]);

    const refetchUsers = useCallback(async () => {
        await new Promise((res) => setTimeout(res, 500));
        const chainIds = filter.network
            ? (() => {
                const cfg = NETWORK_CONFIGS.find((n) => n.id === filter.network);
                return cfg ? [Number(cfg.backendChainId)] : undefined;
            })()
            : undefined;
        queryClient.invalidateQueries({
            queryKey: whitelistUserQueryKeys.listUsers({
                search: filter.text || undefined,
                chainIds,
                tokenAddresses: filter.tokens.length > 0 ? filter.tokens : undefined,
            }),
        });
    }, [queryClient, filter]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next)
                reset({
                    networkId: currentNetworkId ?? "ethereumTestnet",
                    walletAddress: "",
                    name: "",
                    email: "",
                });
            setOpen(next);
        },
        [reset, currentNetworkId],
    );

    const onSubmit = async (data: WhitelistUserFormValues) => {
        const isSolanaNetwork = data.networkId === "solanaDevnet";

        // Validate address format matches selected network
        if (isSolanaNetwork && !isSolanaAddress(data.walletAddress)) {
            toast.error("Must be a valid Solana address");
            return;
        }
        if (!isSolanaNetwork && !isEvmAddress(data.walletAddress)) {
            toast.error("Must be a valid EVM address (0x...)");
            return;
        }

        setIsCallingSc(true);
        let scResult = false;
        if (isSolana) {
            scResult = await createSolana({ userAddress: data.walletAddress });
        } else if (isEvm) {
            scResult = await createEvm({ userAddress: data.walletAddress });
        }
        setIsCallingSc(false);
        if (!scResult) return;

        // Persist name/email metadata (optional)
        const hasInfo = !!data.name?.trim() || !!data.email?.trim();
        if (hasInfo) {
            try {
                const networkCfg = NETWORK_CONFIGS.find((n) => n.id === data.networkId);
                await whitelistUserService.updateUserInfo({
                    walletAddress: data.walletAddress.trim(),
                    chainId: networkCfg?.backendChainId ?? "",
                    name: data.name?.trim() || undefined,
                    email: data.email?.trim() || undefined,
                });
            } catch (error) {
                toast.error(getErrorMessage({ error }));
                return;
            }
        }

        refetchUsers();
        handleOpenChange(false);
    };

    const isLoading = isCallingSc;
    const addressPlaceholder =
        currentNetworkId === "solanaDevnet"
            ? "e.g. 9noXzpXnLLrrTn…"
            : "0x0000000000000000000000000000000000000000";


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
                    <DialogDescription>Add a new user to the transfer whitelist</DialogDescription>
                </DialogHeader>

                <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-3.75">
                        {/* Network selection */}
                        <Controller
                            control={control}
                            name="networkId"
                            render={({ field }) => (
                                <Field className="gap-3.25">
                                    <FieldLabel htmlFor={field.name}>
                                        Network
                                        <span className="text-md-required-red">*</span>
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
                                                isActive={currentNetworkId === network.id}
                                                btnProps={{
                                                    onClick: () => {
                                                        if (currentNetworkId !== network.id) {
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
                                </Field>
                            )}
                        />

                        {/* Wallet Address */}
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
                                        placeholder={addressPlaceholder}
                                        className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />

                        {/* Name */}
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

                        {/* Email */}
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

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4.5">
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
                        {!caipAddress ? (
                            <AnimateIconButton
                                variant="letter-icon"
                                iconLetter="W"
                                text="Connect Wallet"
                                color="#9072f9"
                                textVariant="text-self-center"
                                classNames={{
                                    btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                                }}
                                btnProps={{ type: "button", onClick: () => openAppKit() }}
                            />
                        ) : (
                            <AnimateIconButton
                                variant="letter-icon"
                                iconLetter="A"
                                text="Add to Whitelist"
                                color="#9072f9"
                                textVariant="text-self-center"
                                classNames={{
                                    btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                                }}
                                isLoading={isLoading}
                                isLoadingText="Adding..."
                                btnProps={{ type: "submit" }}
                            />
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminWhitelistUserDialogCreate;
