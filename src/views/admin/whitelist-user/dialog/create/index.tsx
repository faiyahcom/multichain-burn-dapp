import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon, CheckCircle2Icon, ArrowRightLeftIcon, AlertCircleIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import AnimateIconButton from "@/components/common/animate-icon-button";
import NetworkImgIcon from "@/components/common/network-img-icon";
import { useState, useMemo, useCallback } from "react";
import { useAppKitNetwork, useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useCreateWhitelistUserSolanaFn } from "./useCreateWhitelistUserSolanaFn";
import { useCreateWhitelistUserEvmFn } from "./useCreateWhitelistUserEvmFn";
import { whitelistUserService } from "@/services/whitelistUserService";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { isSolanaAddress, isEvmAddress } from "@/utils/helpers/address";
import { toast } from "@/components/common/custom-toast";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { cn } from "@/lib/utils";

// ─── address schema ───────────────────────────────────────────────────────────
const baseSchema = {
    name: z.string().optional(),
    email: z.string().email({ error: "Invalid email address" }).optional().or(z.literal("")),
};

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

type WhitelistUserFormValues = z.infer<ReturnType<typeof buildSchema>>;

// ─── helpers ──────────────────────────────────────────────────────────────────
const SOLANA_NETWORK_ID: NetworkId = "solanaDevnet";
const EVM_NETWORK_IDS = NETWORK_CONFIGS.filter((n) => n.id !== SOLANA_NETWORK_ID).map((n) => n.id);

// ─── component ────────────────────────────────────────────────────────────────
const AdminWhitelistUserDialogCreate = () => {
    const [open, setOpen] = useState(false);
    const [isCallingSc, setIsCallingSc] = useState(false);

    // Which networks the admin wants to whitelist this user on
    const [selectedNetworks, setSelectedNetworks] = useState<NetworkId[]>([]);

    const { caipNetwork, switchNetwork } = useAppKitNetwork();
    const { open: openAppKit } = useAppKit();

    // ── Track actual wallet connection per namespace ──────────────────────────
    const { isConnected: isEvmConnected } = useAppKitAccount({ namespace: "eip155" });
    const { isConnected: isSolanaConnected } = useAppKitAccount({ namespace: "solana" });

    const { createWhitelistUser: createSolana } = useCreateWhitelistUserSolanaFn();
    const { createWhitelistUser: createEvm } = useCreateWhitelistUserEvmFn();

    // ── derive whether selection is Solana or EVM type ────────────────────────
    const hasSolana = selectedNetworks.includes(SOLANA_NETWORK_ID);
    const hasEvm = selectedNetworks.some((id) => EVM_NETWORK_IDS.includes(id));
    const networkTypeConflict = hasSolana && hasEvm;

    // ── connected network matching ─────────────────────────────────────────────
    // Derive which network is ACTUALLY connected by checking both:
    //   1) the caipNetwork matches a config entry
    //   2) the wallet for that namespace is genuinely connected
    const connectedNetworkCfg = useMemo(() => {
        if (!caipNetwork) return undefined;
        const cfg = NETWORK_CONFIGS.find((n) => n.appKitNetwork.id === caipNetwork.id);
        if (!cfg) return undefined;

        // Verify the wallet is actually connected for this namespace
        const isSolanaNetwork = cfg.id === SOLANA_NETWORK_ID;
        const walletActuallyConnected = isSolanaNetwork ? isSolanaConnected : isEvmConnected;

        return walletActuallyConnected ? cfg : undefined;
    }, [caipNetwork, isEvmConnected, isSolanaConnected]);

    // ── Determine if wallet connection is needed ──────────────────────────────
    const needsWalletConnection = useMemo(() => {
        if (selectedNetworks.length === 0 || networkTypeConflict) return false;
        if (hasSolana && !isSolanaConnected) return "solana";
        if (hasEvm && !isEvmConnected) return "evm";
        return false;
    }, [selectedNetworks, networkTypeConflict, hasSolana, hasEvm, isSolanaConnected, isEvmConnected]);

    // ── address validation depends on selection type ───────────────────────────
    const schema = useMemo(() => buildSchema(hasSolana && !hasEvm), [hasSolana, hasEvm]);

    const { control, handleSubmit, reset } = useForm<WhitelistUserFormValues>({
        defaultValues: { name: "", email: "", walletAddress: "" },
        resolver: zodResolver(schema),
    });

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                reset();
                setSelectedNetworks([]);
            }
            setOpen(next);
        },
        [reset],
    );

    // ── network pill toggle (mutually exclusive: solana vs evm) ───────────────
    const toggleNetwork = (id: NetworkId) => {
        setSelectedNetworks((prev) => {
            if (prev.includes(id)) return prev.filter((n) => n !== id);
            // If toggling Solana → clear EVM; if toggling EVM → clear Solana
            const isSolId = id === SOLANA_NETWORK_ID;
            const filtered = isSolId
                ? prev.filter((n) => n === SOLANA_NETWORK_ID) // keep only solana (clear evm)
                : prev.filter((n) => n !== SOLANA_NETWORK_ID); // clear solana
            return [...filtered, id];
        });
    };

    // ── submit: only handles the currently connected network ──────────────────
    const onSubmit = async (data: WhitelistUserFormValues) => {
        if (selectedNetworks.length === 0) {
            toast.error("Select at least one network");
            return;
        }
        if (networkTypeConflict) {
            toast.error("Cannot mix Solana and EVM networks");
            return;
        }

        // Check actual wallet connection for the target namespace
        if (hasSolana && !isSolanaConnected) {
            toast.error("Please connect your Solana wallet before submitting");
            return;
        }
        if (hasEvm && !isEvmConnected) {
            toast.error("Please connect your EVM wallet before submitting");
            return;
        }

        if (!connectedNetworkCfg || !selectedNetworks.includes(connectedNetworkCfg.id)) {
            toast.error("Switch to one of the selected networks to proceed");
            return;
        }

        setIsCallingSc(true);
        let scResult = false;
        if (connectedNetworkCfg.id === SOLANA_NETWORK_ID) {
            scResult = await createSolana({ userAddress: data.walletAddress });
        } else {
            scResult = await createEvm({ userAddress: data.walletAddress });
        }
        setIsCallingSc(false);
        if (!scResult) return;

        // Persist name/email metadata (optional)
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

        // Remove this network from the selection — if more remain, keep dialog open
        const remaining = selectedNetworks.filter((n) => n !== connectedNetworkCfg.id);
        if (remaining.length === 0) {
            handleOpenChange(false);
        } else {
            setSelectedNetworks(remaining);
            toast.info(`Done for ${connectedNetworkCfg.label}. Switch network to continue.`);
        }
    };

    const isLoading = isCallingSc;
    const addressPlaceholder = hasSolana
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
                    {/* ── Network selection ── */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Networks<span className="text-md-required-red">*</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {NETWORK_CONFIGS.map((n) => {
                                const isSelected = selectedNetworks.includes(n.id);
                                // Use actual wallet connection, not just caipNetwork match
                                const isSolanaNetwork = n.id === SOLANA_NETWORK_ID;
                                const isWalletConnected = isSolanaNetwork
                                    ? isSolanaConnected
                                    : isEvmConnected;
                                const isNetworkConnected =
                                    connectedNetworkCfg?.id === n.id && isWalletConnected;
                                return (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => toggleNetwork(n.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border text-secondary-text hover:border-primary/50",
                                        )}
                                    >
                                        <NetworkImgIcon src={n.iconSrc} alt={n.label} className="size-4" />
                                        {n.label}
                                        {isNetworkConnected && isSelected && (
                                            <CheckCircle2Icon className="size-3.5 text-green-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {networkTypeConflict && (
                            <p className="text-xs text-destructive">
                                Cannot mix Solana and EVM networks — they use different address formats.
                            </p>
                        )}
                    </div>



                    {/* ── Per-network status + switch buttons ── */}
                    {selectedNetworks.length > 0 && !networkTypeConflict && (
                        <div className="flex flex-wrap gap-2">
                            {selectedNetworks.map((id) => {
                                const cfg = NETWORK_CONFIGS.find((n) => n.id === id)!;
                                const isSolanaNetwork = id === SOLANA_NETWORK_ID;
                                const isWalletConnected = isSolanaNetwork
                                    ? isSolanaConnected
                                    : isEvmConnected;
                                const isNetworkConnected =
                                    connectedNetworkCfg?.id === id && isWalletConnected;
                                return (
                                    <div
                                        key={id}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                                            isNetworkConnected
                                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                                : !isWalletConnected
                                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                                                  : "border-border text-secondary-text",
                                        )}
                                    >
                                        <NetworkImgIcon src={cfg.iconSrc} alt={cfg.label} className="size-3.5" />
                                        <span>{cfg.label}</span>
                                        {isNetworkConnected ? (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle2Icon className="size-3" />
                                                Connected
                                            </span>
                                        ) : !isWalletConnected ? (
                                            <span className="flex items-center gap-1 text-amber-400">
                                                <AlertCircleIcon className="size-3" />
                                                Wallet not connected
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => switchNetwork(cfg.appKitNetwork)}
                                                className="flex items-center gap-1 text-primary hover:underline"
                                            >
                                                <ArrowRightLeftIcon className="size-3" />
                                                Switch
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Form fields ── */}
                    <div className="space-y-3.75">
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
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                                        placeholder={addressPlaceholder}
                                        className="px-5 placeholder:text-15px placeholder:text-secondary-text"
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </div>

                    {/* ── Actions ── */}
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
                        {needsWalletConnection ? (
                            <AnimateIconButton
                                variant="letter-icon"
                                iconLetter="W"
                                text="Connect Wallet"
                                color="#9072f9"
                                textVariant="text-self-center"
                                classNames={{
                                    btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border ml-5",
                                }}
                                btnProps={{
                                    type: "button",
                                    onClick: () => openAppKit(),
                                }}
                            />
                        ) : (
                            <AnimateIconButton
                                variant="letter-icon"
                                iconLetter="A"
                                text="Add to Whitelist"
                                color="#9072f9"
                                textVariant="text-self-center"
                                classNames={{
                                    btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border ml-5",
                                }}
                                isLoading={isLoading}
                                isLoadingText="Adding..."
                                btnProps={{
                                    type: "submit",
                                    disabled: selectedNetworks.length === 0 || networkTypeConflict,
                                }}
                            />
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminWhitelistUserDialogCreate;
