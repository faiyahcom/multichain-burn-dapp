import AnimateIconButton from "@/components/common/animate-icon-button";
import BlueSwitch from "@/components/common/blue-switch";
import CopyableText from "@/components/common/copyable-text";
import CustomPagination from "@/components/common/pagination";
import NetworkImgIcon from "@/components/common/network-img-icon";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAdminWhitelistUserSearchFilterStore } from "@/stores/admin/whitelist-user/search-filter-store";
import {
    userStatusColors,
    userStatusLabels,
    userStatusLetters,
    type UserStatus,
} from "@/types/admin/whitelist-user";
import { truncateString } from "@/utils/helpers/string";
import { cn } from "@/lib/utils";
import { PencilIcon, EyeIcon } from "lucide-react";
import { useGetWhitelistUsers } from "@/services/queries/queries";
import type { TokenAllocation, WhitelistUser } from "@/services/whitelistUserService";
import { useState, useMemo, useCallback } from "react";
import AdminWhitelistUserDialogEdit from "../dialog/edit";
import { NETWORK_CONFIGS, chainIdToNetworkConfig } from "@/config/networks";
import { useDisableWhitelistUserEvmFn } from "./useDisableWhitelistUserEvmFn";
import { useDisableWhitelistUserSolanaFn } from "./useDisableWhitelistUserSolanaFn";
import { isSolanaAddress, isEvmAddress } from "@/utils/helpers/address";
import { toast } from "@/components/common/custom-toast";
import { useQueryClient } from "@tanstack/react-query";
import { whitelistUserQueryKeys } from "@/services/queries/queryKey";
import { useAppKitAccount } from "@reown/appkit/react";
import { useSystemStore } from "@/stores/systemStore";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { sciToFormatted, shortenNumber } from "@/utils/helpers/numbers";

const MAX_VISIBLE_TOKENS = 3;

/** Maps a chainId string back to the NetworkConfig */
const getNetworkByChainId = (chainId: string) => {
    return chainIdToNetworkConfig(chainId);
};

const TokenAllocationChips: React.FC<{
    allocations: TokenAllocation[];
    userName?: string;
}> = ({ allocations, userName }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    if (allocations.length === 0) return <span className="text-secondary-text text-xs">—</span>;

    const visible = allocations.slice(0, MAX_VISIBLE_TOKENS);
    const hidden = allocations.length - MAX_VISIBLE_TOKENS;

    // Derive distinct networks for the dialog header
    const networks = (() => {
        const seen = new Set<string>();
        return allocations
            .map((a) => getNetworkByChainId(a.chainId))
            .filter((n): n is (typeof NETWORK_CONFIGS)[number] => {
                if (!n || seen.has(n.id)) return false;
                seen.add(n.id);
                return true;
            });
    })();

    return (
        <>
            <div
                className="flex flex-wrap items-center gap-1.5 cursor-pointer"
                onClick={() => setDialogOpen(true)}
            >
                {visible.map((a, i) => (
                    <span
                        key={`${a.tokenAddress}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap"
                    >
                        <span title={sciToFormatted(a.amount, a.tokenDecimals)}>
                            {shortenNumber({number: Number(sciToFormatted(a.amount, a.tokenDecimals))})}
                        </span>
                        <span className="text-primary/70">{a.customSymbol ?? a.tokenSymbol}</span>
                    </span>
                ))}
                {hidden > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-secondary-text">
                        <EyeIcon className="size-3.5" />
                        <span>+{hidden}</span>
                    </span>
                )}
            </div>

            {/* Full token list dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-150 p-0 overflow-hidden">
                    {/* Header section */}
                    <div className="px-8 pt-8 pb-4 text-center">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            Token transfered{userName ? ` \u2013 ${userName}` : ""}
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-secondary-text">
                            Detailed breakdown of all token transfered for this user
                        </DialogDescription>
                    </div>

                    {/* Network badge */}
                    {networks.length > 0 && (
                        <div className="px-6 pb-2 flex items-center gap-1.5 text-sm text-secondary-text">
                            <span>All token balances on</span>
                            {networks.map((n) => (
                                <span key={n.id} className="flex items-center gap-1 font-semibold text-foreground">
                                    <NetworkImgIcon src={n.iconSrc} alt={n.label} className="size-4" />
                                    {n.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Table with margin and white row separators */}
                    <div className="mx-4 mb-6 border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="rounded-sm bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="text-center font-semibold text-foreground py-3">Token</TableHead>
                                    <TableHead className="text-center font-semibold text-foreground py-3">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {allocations.map((a, i) => (
                                    <TableRow
                                        key={`${a.tokenAddress}-${i}`}
                                        className="bg-muted/20 hover:bg-muted/30 rounded-sm p-10"
                                    >
                                        <TableCell className="text-center py-3">{a.customSymbol ?? a.tokenSymbol}</TableCell>
                                        <TableCell className="text-center py-3" 
                                            title={sciToFormatted(a.amount, a.tokenDecimals)}
                                        >
                                            {shortenNumber({number: Number(sciToFormatted(a.amount, a.tokenDecimals))})}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

/** One row per user (each user now has a single chainId) */
interface ExpandedRow {
    user: WhitelistUser;
    chainId: string;
}

interface Props {
    data?: WhitelistUser[];
}

const AdminWhitelistUserTable: React.FC<Props> = ({ data }) => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    const queryClient = useQueryClient();
    const { disableWhitelistUser: disableEvm } = useDisableWhitelistUserEvmFn();
    const { disableWhitelistUser: disableSolana } = useDisableWhitelistUserSolanaFn();
    const [disablingKey, setDisablingKey] = useState<string | null>(null);
    const { caipAddress } = useAppKitAccount();
    const { openSwitchNetworkModal } = useSystemStore();
    const [namespace, chainRef] = caipAddress?.split(":") ?? [];
    const currentNetworkId =
        namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

    const refetchUsers = useCallback(async () => {
        await new Promise((res) => setTimeout(res, 500));
        queryClient.invalidateQueries({
            queryKey: whitelistUserQueryKeys.listUsers({
                search: filter.text || undefined,
                chainIds: filter.network
                    ? (() => {
                        const cfg = NETWORK_CONFIGS.find((n) => n.id === filter.network);
                        return cfg ? [Number(cfg.backendChainId)] : undefined;
                    })()
                    : undefined,
                tokenAddresses: filter.tokens.length > 0 ? filter.tokens : undefined,
            }),
        });
    }, [queryClient, filter]);

    const handleToggleRow = useCallback(
        async (user: WhitelistUser, chainId: string) => {
            const addr = user.address.trim();
            const whitelist = !user.enable; // toggle
            const rowKey = `${addr}-${chainId}`;

            if (isEvmAddress(addr)) {
                // Determine which network this chainId belongs to
                const targetNetworkId = mapChainToSystemNetwork("eip155", chainId);
                if (targetNetworkId && currentNetworkId !== targetNetworkId) {
                    openSwitchNetworkModal(currentNetworkId, targetNetworkId);
                    return;
                }
                setDisablingKey(rowKey);
                const ok = await disableEvm({ userAddress: addr, whitelist });
                setDisablingKey(null);
                if (ok) refetchUsers();
            } else if (isSolanaAddress(addr)) {
                setDisablingKey(rowKey);
                const ok = await disableSolana({ userAddress: addr, whitelist });
                setDisablingKey(null);
                if (ok) refetchUsers();
            } else {
                toast.error("Unknown address format", {
                    description: `Cannot determine network for: ${addr.slice(0, 20)}…`,
                });
            }
        },
        [disableEvm, disableSolana, refetchUsers, namespace, currentNetworkId, openSwitchNetworkModal],
    );

    // Map single NetworkId → numeric chainId for the API (-1 for Solana)
    const chainIds = useMemo(() => {
        if (!filter.network) return undefined;
        const cfg = NETWORK_CONFIGS.find((n) => n.id === filter.network);
        return cfg ? [Number(cfg.backendChainId)] : undefined;
    }, [filter.network]);

    const tokenAddresses = filter.tokens.length > 0 ? filter.tokens : undefined;

    const { data: apiData, isLoading } = useGetWhitelistUsers({
        search: filter.text || undefined,
        chainIds,
        tokenAddresses,
    });

    const users = data ?? apiData?.users ?? [];

    // Each user now has a single chainId from the API
    const expandedRows: ExpandedRow[] = useMemo(() => {
        return users.map((user) => ({ user, chainId: user.chainId ?? "" }));
    }, [users]);

    const [editingUser, setEditingUser] = useState<WhitelistUser | null>(null);

    return (
        <div className="pb-10 pl-3.75 space-y-10">
            <Table className="table-auto">
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-center">Network</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-10 text-center text-secondary-text">
                                Loading...
                            </TableCell>
                        </TableRow>
                    )}

                    {!isLoading && users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-10 text-center text-secondary-text">
                                No users found.
                            </TableCell>
                        </TableRow>
                    )}

                    {!isLoading &&
                        expandedRows.map(({ user, chainId }, index) => {
                            const isFirst = index === 0;
                            const isEnabledOnChain = user.enable;
                            const status: UserStatus = isEnabledOnChain ? "enabled" : "disabled";
                            const rowKey = `${user.address}-${chainId}`;
                            const isDisabling = disablingKey === rowKey;
                            const networkCfg = chainId ? chainIdToNetworkConfig(chainId) : undefined;

                            return (
                                <TableRow
                                    key={rowKey}
                                    className={cn({
                                        "border-l-2 border-l-primary": isFirst,
                                    })}
                                >
                                    {/* User name + email */}
                                    <TableCell>
                                        <div className="flex flex-col text-left pl-2">
                                            <p className={cn("text-base font-semibold", { "text-primary": isFirst })}>
                                                {user.name}
                                            </p>
                                            <p className="text-11px font-normal text-secondary-text">
                                                {user.email}
                                            </p>
                                        </div>
                                    </TableCell>

                                    {/* Status badge */}
                                    <TableCell>
                                        <AnimateIconButton
                                            iconLetter={userStatusLetters[status]}
                                            textVariant="text-self-center"
                                            text={userStatusLabels[status]}
                                            color={userStatusColors[status]}
                                            hasGroupHover
                                            classNames={{ btn: "min-w-27 mx-auto" }}
                                        />
                                    </TableCell>

                                    {/* Address */}
                                    <TableCell>
                                        <CopyableText
                                            content={user.address}
                                            displayText={truncateString({ str: user.address })}
                                        />
                                    </TableCell>

                                    {/* Network — single chain per row */}
                                    <TableCell className="text-center">
                                        <div className="flex justify-center">
                                            {networkCfg ? (
                                                <div className="flex items-center gap-1.5">
                                                    <NetworkImgIcon
                                                        src={networkCfg.iconSrc}
                                                        alt={networkCfg.label}
                                                        className="size-5 shrink-0"
                                                    />
                                                    <span className="text-sm font-medium whitespace-nowrap">
                                                        {networkCfg.label}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-secondary-text text-xs">—</span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Description — token allocations filtered by this row's chain */}
                                    <TableCell>
                                        <TokenAllocationChips
                                            allocations={user.tokenAllocations.filter(
                                                (a) => a.chainId === chainId
                                            )}
                                            userName={user.name}
                                        />
                                    </TableCell>

                                    {/* Added date */}
                                    <TableCell>
                                        <p className="text-sm whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </TableCell>

                                    {/* Action: pencil edit + disable toggle */}
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-4.5">
                                            <button
                                                className="text-secondary-text hover:text-foreground transition-colors"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <PencilIcon className="size-4" />
                                            </button>
                                            <BlueSwitch
                                                active={!!isEnabledOnChain}
                                                isLoading={isDisabling}
                                                disabled={isDisabling}
                                                onClick={() => handleToggleRow(user, chainId)}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>

            {!isLoading && expandedRows.length > 0 && (
                <p className="text-sm text-secondary-text pl-4">
                    Showing {expandedRows.length} rows ({users.length} users)
                </p>
            )}

            {!isLoading && expandedRows.length > 50 && (
                <CustomPagination
                    currentPage={filter.page}
                    totalCount={apiData?.total ?? 0}
                    pageSize={50}
                    onPageChange={(page) => setFilter({ page })}
                />
            )}

            {editingUser && (
            <AdminWhitelistUserDialogEdit
                user={editingUser}
                open={!!editingUser}
                onOpenChange={(open) => {
                    if (!open) setEditingUser(null);
                }}
                onSuccess={refetchUsers}
            />
            )}
        </div>
    );
};

export default AdminWhitelistUserTable;
