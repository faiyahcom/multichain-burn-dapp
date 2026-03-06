import { useMemo, useState } from "react";
import { useGetWhitelistUsers } from "@/services/queries/queries";
import { chainIdToNetworkConfig, SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import type { WhitelistUser } from "@/services/whitelistUserService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import NetworkImgIcon from "@/components/common/network-img-icon";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function truncateAddr(addr: string, head = 6, tail = 4): string {
    if (!addr || addr.length <= head + tail) return addr;
    return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

// ── sub-components ────────────────────────────────────────────────────────────

interface UserRowProps {
    user: WhitelistUser;
    selected: boolean;
    onToggle: () => void;
}

const UserRow = ({ user, selected, onToggle }: UserRowProps) => (
    <div
        className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all",
            selected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
        )}
        onClick={onToggle}
    >
        {/* custom checkbox */}
        <div
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                selected ? "border-primary bg-primary" : "border-muted-foreground",
            )}
        >
            {selected && (
                <svg viewBox="0 0 10 8" fill="none" className="size-3">
                    <path
                        d="M1 4l3 3 5-6"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </div>

        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
                {user.name || "—"}
            </p>
            <p className="truncate text-xs text-secondary-text">{user.email || "—"}</p>
            <p className="truncate font-mono text-xs text-secondary-text/70">
                {truncateAddr(user.address)}
            </p>
        </div>
    </div>
);

// ── main dialog ───────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chainId: string;
    poolInfo: {
        tokenSymbol?: string;
        rewardTokenSymbol?: string;
        currentRewardAmount?: string;
        rewardTokenDecimals?: number;
    };
    onTransfer: (userAddress: string) => Promise<void>;
}

const TransferTokensDialog = ({
    open,
    onOpenChange,
    chainId,
    poolInfo,
    onTransfer,
}: Props) => {
    const [search, setSearch] = useState("");
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);

    // Convert backendChainId to numeric for the API
    const chainIdNum = Number(chainId);
    const networkConfig = chainIdToNetworkConfig(chainId);

    const { data, isLoading } = useGetWhitelistUsers(
        open
            ? {
                chainIds: isNaN(chainIdNum) ? undefined : [chainIdNum],
                // only enabled users
            }
            : undefined,
    );

    // Filter to enabled users only, then apply text search
    const users = useMemo(() => {
        const enabled = (data?.users ?? []).filter((u) => u.enabled);
        const q = search.trim().toLowerCase();
        if (!q) return enabled;
        return enabled.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.address?.toLowerCase().includes(q),
        );
    }, [data, search]);

    const handleClose = () => {
        setSearch("");
        setSelectedAddress(null);
        onOpenChange(false);
    };

    const handleTransfer = async () => {
        if (!selectedAddress) return;
        setIsTransferring(true);
        await onTransfer(selectedAddress);
        setIsTransferring(false);
        handleClose();
    };

    const isSolana = chainId === SOLANA_BACKEND_CHAIN_ID;
    const networkLabel = networkConfig?.label ?? (isSolana ? "Solana" : "Unknown");
    const networkIconSrc = networkConfig?.iconSrc;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* ── Header ── */}
                <DialogHeader className="px-8 pb-4 pt-8 text-center">
                    <DialogTitle className="text-2xl font-bold">TRANSFER TOKENS</DialogTitle>
                    <DialogDescription className="text-secondary-text">
                        Send tokens to one or more recipients from the pool
                    </DialogDescription>
                </DialogHeader>

                {/* ── Pool info strip ── */}
                <div className="mx-6 mb-5 rounded-xl border border-border bg-muted/30 px-5 py-4">
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-secondary-text">
                        <svg viewBox="0 0 16 16" fill="none" className="size-3.5 text-primary">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M6 8l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Pool Reward Info
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Token */}
                        <div className="flex flex-col gap-0.5 rounded-lg bg-background px-3 py-2.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-secondary-text">
                                TOKEN
                            </span>
                            <span className="text-sm font-bold text-foreground">
                                {poolInfo.tokenSymbol ?? "—"}
                            </span>
                        </div>
                        {/* Network */}
                        <div className="flex flex-col gap-0.5 rounded-lg bg-background px-3 py-2.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-secondary-text">
                                NETWORK
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                                {networkIconSrc && (
                                    <NetworkImgIcon
                                        src={networkIconSrc}
                                        alt={networkLabel}
                                        className="size-4"
                                    />
                                )}
                                {networkLabel}
                            </span>
                        </div>
                        {/* Available */}
                        <div className="flex flex-col gap-0.5 rounded-lg bg-background px-3 py-2.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-secondary-text">
                                AVAILABLE
                            </span>
                            <span className="text-sm font-bold text-active">
                                {poolInfo.currentRewardAmount ?? "—"}{" "}
                                <span className="text-xs font-normal text-secondary-text">
                                    ({poolInfo.rewardTokenSymbol ?? ""})
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Recipients header ── */}
                <div className="flex items-center justify-between px-6 pb-2">
                    <span className="text-sm font-semibold text-foreground">Recipients</span>
                    {!isLoading && (
                        <span className="text-xs text-secondary-text">
                            {users.length} user{users.length !== 1 ? "s" : ""} available
                        </span>
                    )}
                </div>

                {/* ── Search ── */}
                <div className="relative mx-6 mb-3">
                    <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-text" />
                    <Input
                        placeholder="Search by name, email, or wallet..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* ── User list ── */}
                <div className="flex-1 space-y-2 overflow-y-auto px-6 pb-2">
                    {isLoading && (
                        <p className="py-6 text-center text-sm text-secondary-text">
                            Loading users…
                        </p>
                    )}
                    {!isLoading && users.length === 0 && (
                        <p className="py-6 text-center text-sm text-secondary-text">
                            No enabled users found for this chain.
                        </p>
                    )}
                    {users.map((user) => (
                        <UserRow
                            key={user.address}
                            user={user}
                            selected={selectedAddress === user.address}
                            onToggle={() =>
                                setSelectedAddress((prev) =>
                                    prev === user.address ? null : user.address,
                                )
                            }
                        />
                    ))}
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-4 border-t border-border px-6 py-5">
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="C"
                        text="Cancel"
                        color="#FF8E8E"
                        textVariant="text-container-center"
                        classNames={{
                            btn: "bg-mb-cancel-gray sm:min-w-36 sm:py-3 sm:px-2 border border-inactive",
                        }}
                        btnProps={{ onClick: handleClose, disabled: isTransferring }}
                    />
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="T"
                        text={isTransferring ? "Transferring…" : "Transfer"}
                        color="#9072f9"
                        textVariant="text-self-center"
                        classNames={{
                            btn: "sm:min-w-36 sm:py-3 sm:px-2 border border-mb-submit-border",
                        }}
                        btnProps={{
                            onClick: handleTransfer,
                            disabled: !selectedAddress || isTransferring,
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TransferTokensDialog;
