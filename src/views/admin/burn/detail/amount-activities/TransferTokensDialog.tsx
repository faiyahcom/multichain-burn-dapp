import { useMemo, useState, useCallback, useEffect } from "react";
import { shortenNumber } from "@/utils/helpers/numbers";
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
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TokenMode, BatchRecipient } from "./hooks/useBatchTransferSolFn";

// ── helpers ──────────────────────────────────────────────────────────────────

function truncateAddr(addr: string, head = 6, tail = 4): string {
    if (!addr || addr.length <= head + tail) return addr;
    return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

// ── UserRow ───────────────────────────────────────────────────────────────────

interface UserRowProps {
    user: WhitelistUser;
    selected: boolean;
    amount: string;
    tokenSymbol: string;
    onToggle: () => void;
    onAmountChange: (val: string) => void;
}

const UserRow = ({ user, selected, amount, tokenSymbol, onToggle, onAmountChange }: UserRowProps) => (
    <div
        className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all",
            selected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30",
        )}
        onClick={onToggle}
    >
        {/* checkbox */}
        <div
            className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                selected ? "border-primary bg-primary" : "border-muted-foreground",
            )}
        >
            {selected && (
                <svg viewBox="0 0 10 8" fill="none" className="size-3">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>

        {/* user info */}
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{user.name || "—"}</p>
            <p className="truncate text-xs text-secondary-text">{user.email || "—"}</p>
            <p className="truncate font-mono text-xs text-secondary-text/70">{truncateAddr(user.address)}</p>
        </div>

        {/* amount input — only shown when selected */}
        {selected && (
            <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
            >
                <Input
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="h-8 w-36 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    min="0"
                />
                <span className="text-xs font-medium text-secondary-text">{tokenSymbol}</span>
            </div>
        )}
    </div>
);

// ── Main dialog ───────────────────────────────────────────────────────────────

export interface TransferTokensDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chainId: string;
    /** 0 = burn pool (dynamic), 1 = swap pool (fixed ratio) */
    poolKind?: number;
    poolInfo: {
        tokenInSymbol?: string;
        rewardTokenSymbol?: string;
        currentRewardAmount?: string;
        currentDepositAmount?: string;
        rewardTokenDecimals?: number;
        tokenInDecimals?: number;
    };
    onTransfer: (recipients: BatchRecipient[], mode: TokenMode) => Promise<void>;
}

const TransferTokensDialog = ({
    open,
    onOpenChange,
    chainId,
    poolKind,
    poolInfo,
    onTransfer,
}: TransferTokensDialogProps) => {
    const isSwapPool = poolKind === 1;
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<TokenMode>("reward");
    /** map: address → amount string */
    const [selectedMap, setSelectedMap] = useState<Map<string, string>>(new Map());
    const [isTransferring, setIsTransferring] = useState(false);

    // ── Optimistic local balances ─────────────────────────────────────────────
    // Seeded from props; immediately decremented after each successful transfer
    // so the UI reflects the new balance without waiting for the backend indexer.
    const [localRewardAmount, setLocalRewardAmount] = useState<string | undefined>(poolInfo.currentRewardAmount);
    const [localDepositAmount, setLocalDepositAmount] = useState<string | undefined>(poolInfo.currentDepositAmount);

    // Sync from props whenever the server data updates
    useEffect(() => {
        setLocalRewardAmount(poolInfo.currentRewardAmount);
    }, [poolInfo.currentRewardAmount]);
    useEffect(() => {
        setLocalDepositAmount(poolInfo.currentDepositAmount);
    }, [poolInfo.currentDepositAmount]);
    // Reset local state when dialog closes
    useEffect(() => {
        if (!open) {
            setLocalRewardAmount(poolInfo.currentRewardAmount);
            setLocalDepositAmount(poolInfo.currentDepositAmount);
        }
    }, [open]);

    const chainIdNum = Number(chainId);
    const networkConfig = chainIdToNetworkConfig(chainId);
    const isSolana = chainId === SOLANA_BACKEND_CHAIN_ID;

    const { data, isLoading } = useGetWhitelistUsers(
        open ? { chainIds: isNaN(chainIdNum) ? undefined : [chainIdNum] } : undefined,
    );

    // enabled users only, filtered by search
    const users = useMemo(() => {
        const enabled = (data?.users ?? []).filter((u) => u.enableChainId.includes(chainIdNum.toString()));
        const q = search.trim().toLowerCase();
        if (!q) return enabled;
        return enabled.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.address?.toLowerCase().includes(q),
        );
    }, [data, search]);

    const selectedTokenSymbol = mode === "reward"
        ? (poolInfo.rewardTokenSymbol ?? "")
        : (poolInfo.tokenInSymbol ?? "");

    // Available amount switches with mode — use optimistic local state
    const displayAvailableAmount = mode === "reward"
        ? (localRewardAmount ?? "—")
        : (localDepositAmount ?? "—");
    const displayAvailableSymbol = mode === "reward"
        ? (poolInfo.rewardTokenSymbol ?? "")
        : (poolInfo.tokenInSymbol ?? "");

    const networkLabel = networkConfig?.label ?? (isSolana ? "Solana" : "Unknown");
    const networkIconSrc = networkConfig?.iconSrc;

    // ── helpers ──────────────────────────────────────────────────────────────
    const toggleUser = useCallback((addr: string) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            if (next.has(addr)) {
                next.delete(addr);
            } else {
                next.set(addr, "");
            }
            return next;
        });
    }, []);

    const setAmount = useCallback((addr: string, val: string) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            next.set(addr, val);
            return next;
        });
    }, []);

    const removeSelected = useCallback((addr: string) => {
        setSelectedMap((prev) => {
            const next = new Map(prev);
            next.delete(addr);
            return next;
        });
    }, []);

    // summary
    const selectedEntries = [...selectedMap.entries()];
    const totalAmount = parseFloat(
        selectedEntries
            .reduce((sum, [, amt]) => sum + (parseFloat(amt) || 0), 0)
            .toFixed(9),
    );

    const handleClose = () => {
        setSearch("");
        setSelectedMap(new Map());
        setMode("reward");
        onOpenChange(false);
    };

    const handleTransfer = async () => {
        const recipients: BatchRecipient[] = selectedEntries
            .filter(([, amt]) => parseFloat(amt) > 0)
            .map(([address, amountStr]) => ({ address, amountStr }));

        if (recipients.length === 0) {
            return;
        }

        // Compute total being sent so we can optimistically update the balance
        const totalSent = selectedEntries.reduce(
            (sum, [, amt]) => sum + (parseFloat(amt) || 0),
            0,
        );

        setIsTransferring(true);
        try {
            await onTransfer(recipients, mode);
            // ── Optimistic balance update ──────────────────────────────────
            // Immediately subtract the sent amount from the displayed balance.
            // The backend indexer may lag; this keeps the UI accurate right away.
            const subtractFrom = (current: string | undefined) => {
                const parsed = parseFloat((current ?? "0").replace(/,/g, ""));
                if (isNaN(parsed)) return current;
                const updated = Math.max(0, parsed - totalSent);
                return updated.toFixed(6);
            };
            if (mode === "reward") {
                setLocalRewardAmount(subtractFrom(localRewardAmount));
            } else {
                setLocalDepositAmount(subtractFrom(localDepositAmount));
            }
            setSelectedMap(new Map());
            setSearch("");
        } finally {
            setIsTransferring(false);
        }
    };

    const canTransfer = selectedEntries.length > 0 && selectedEntries.every(([, amt]) => parseFloat(amt) > 0);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* ── Header ── */}
                <DialogHeader className="px-8 pb-4 pt-7 text-center">
                    <DialogTitle className="text-2xl font-bold">TRANSFER TOKENS</DialogTitle>
                    <DialogDescription className="text-secondary-text">
                        Send tokens to one or more recipients from the pool
                    </DialogDescription>
                </DialogHeader>

                {/* ── Pool info strip ── */}
                <div className="mx-6 mb-4">
                    {/* Staking Rewards Pool label */}
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        {/* staking / link icon */}
                        <svg viewBox="0 0 20 20" fill="none" className="size-4 text-secondary-text" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.5 10C3.5 6.41 6.41 3.5 10 3.5s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5S3.5 13.59 3.5 10z" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M7 10h6M10 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Staking Rewards Pool
                    </p>

                    {/* 3-card row */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* TOKEN */}
                        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 px-3 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">TOKEN</span>
                            <span className="flex items-center gap-1.5">
                                {/* wallet icon */}
                                <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 text-secondary-text" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                    <path d="M1 7h14" stroke="currentColor" strokeWidth="1.2" />
                                    <circle cx="11.5" cy="10" r="1" fill="currentColor" />
                                    <path d="M1 6V4.5A1.5 1.5 0 012.5 3h10A1.5 1.5 0 0114 4.5V6" stroke="currentColor" strokeWidth="1.2" />
                                </svg>
                                <span className="text-sm font-bold text-foreground leading-tight">
                                    {mode === "reward"
                                        ? poolInfo.rewardTokenSymbol ?? "—"
                                        : poolInfo.tokenInSymbol ?? "—"}
                                    {" "}
                                    <span className="font-normal text-secondary-text">
                                        ({mode === "reward"
                                            ? poolInfo.rewardTokenSymbol ?? ""
                                            : poolInfo.tokenInSymbol ?? ""})
                                    </span>
                                </span>
                            </span>
                        </div>

                        {/* NETWORK */}
                        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 px-3 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">NETWORK</span>
                            <span className="flex items-center gap-1.5">
                                {/* globe icon or network icon */}
                                {networkIconSrc
                                    ? <NetworkImgIcon src={networkIconSrc} alt={networkLabel} className="size-4 shrink-0" />
                                    : (
                                        <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 text-secondary-text" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                                            <path d="M8 1.5C8 1.5 6 4.5 6 8s2 6.5 2 6.5M8 1.5C8 1.5 10 4.5 10 8s-2 6.5-2 6.5M1.5 8h13" stroke="currentColor" strokeWidth="1.2" />
                                        </svg>
                                    )
                                }
                                <span className="leading-tight">
                                    <p className="text-sm font-bold text-foreground">{networkLabel}</p>
                                    <p className="text-[10px] text-secondary-text">
                                        {networkConfig?.appKitNetwork?.name ?? networkLabel}
                                    </p>
                                </span>
                            </span>
                        </div>

                        {/* AVAILABLE */}
                        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 px-3 py-2.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary-text">Available</span>
                            <span className="flex items-center gap-1.5">
                                {/* chain-link / coins icon */}
                                <svg viewBox="0 0 16 16" fill="none" className="size-4 shrink-0 text-primary" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.5 9.5a3.536 3.536 0 005 0l2-2a3.536 3.536 0 00-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                    <path d="M9.5 6.5a3.536 3.536 0 00-5 0l-2 2a3.536 3.536 0 005 5l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                <span className="leading-tight">
                                    <span className="text-sm font-bold text-primary">
                                        {displayAvailableAmount}
                                    </span>
                                    {" "}
                                    <span className="text-[10px] text-secondary-text">
                                        ({displayAvailableSymbol})
                                    </span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Token mode toggle ── */}
                <div className="mx-6 mb-4 grid grid-cols-2 rounded-lg border border-border bg-muted/30">
                    <button
                        type="button"
                        className={cn(
                            "rounded-l-lg py-2.5 text-sm font-medium transition-all",
                            mode === "reward"
                                ? "bg-primary text-white shadow-sm"
                                : "bg-transparent text-secondary-text hover:bg-muted/40",
                        )}
                        onClick={() => setMode("reward")}
                    >
                        Reward Token
                    </button>
                    <button
                        type="button"
                        disabled={isSwapPool}
                        className={cn(
                            "rounded-r-lg border-l border-border py-2.5 text-sm font-medium transition-all",
                            mode === "deposit" && !isSwapPool
                                ? "bg-primary text-white shadow-sm"
                                : "bg-transparent text-secondary-text",
                            isSwapPool
                                ? "cursor-not-allowed opacity-35"
                                : mode !== "deposit" && "hover:bg-muted/40",
                        )}
                        onClick={() => !isSwapPool && setMode("deposit")}
                        title={isSwapPool ? "Swap pools only allow reward token transfers" : undefined}
                    >
                        Deposit Token
                    </button>
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
                        <p className="py-6 text-center text-sm text-secondary-text">Loading users…</p>
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
                            selected={selectedMap.has(user.address)}
                            amount={selectedMap.get(user.address) ?? ""}
                            tokenSymbol={selectedTokenSymbol}
                            onToggle={() => toggleUser(user.address)}
                            onAmountChange={(val) => setAmount(user.address, val)}
                        />
                    ))}
                </div>

                {/* ── Summary bar ── */}
                {selectedEntries.length > 0 && (
                    <div className="mx-6 mb-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">
                                {selectedEntries.length} recipient{selectedEntries.length > 1 ? "s" : ""} selected
                            </span>
                            <span className="text-xs font-semibold text-primary">
                                {shortenNumber({ number: totalAmount })} {selectedTokenSymbol} total
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedEntries.map(([addr, amt]) => {
                                const u = data?.users?.find((u) => u.address === addr);
                                return (
                                    <span
                                        key={addr}
                                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                                    >
                                        {u?.name || truncateAddr(addr)}
                                        {amt && <span className="font-semibold">{amt} {selectedTokenSymbol}</span>}
                                        <button
                                            onClick={() => removeSelected(addr)}
                                            className="ml-0.5 rounded-full hover:bg-primary/20"
                                        >
                                            <XIcon className="size-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex items-center justify-end gap-4 border-t border-border px-6 py-4">
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="C"
                        text="Cancel"
                        color="#FF8E8E"
                        textVariant="text-container-center"
                        classNames={{ btn: "bg-mb-cancel-gray sm:min-w-36 sm:py-3 sm:px-2 border border-inactive" }}
                        btnProps={{ onClick: handleClose, disabled: isTransferring }}
                    />
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="T"
                        text="Transfer"
                        color="#9072f9"
                        textVariant="text-self-center"
                        classNames={{ btn: "sm:min-w-36 sm:py-3 sm:px-2 border border-mb-submit-border" }}
                        isLoading={isTransferring}
                        isLoadingText="Transferring…"
                        btnProps={{
                            onClick: handleTransfer,
                            disabled: !canTransfer || isTransferring,
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TransferTokensDialog;
