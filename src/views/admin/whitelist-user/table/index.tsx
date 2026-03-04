import AnimateIconButton from "@/components/common/animate-icon-button";
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
import { useState, useMemo } from "react";
import AdminWhitelistUserDialogEdit from "../dialog/edit";
import { NETWORK_CONFIGS } from "@/config/networks";

const MAX_VISIBLE_TOKENS = 3;

/** Maps a chainId string back to the NetworkConfig */
const getNetworkByChainId = (chainId: string) => {
    return NETWORK_CONFIGS.find((n) => {
        const id = n.appKitNetwork?.id;
        return typeof id === "number" ? String(id) === chainId : chainId === "-1";
    });
};

/** Formats a raw BigInt amount string using token decimals into a human-readable value */
const formatTokenAmount = (amount: string, decimals: number): string => {
    try {
        const raw = BigInt(amount);
        if (decimals === 0) return raw.toLocaleString();

        const divisor = BigInt(10 ** decimals);
        const whole = raw / divisor;
        const frac = raw % divisor;

        if (frac === 0n) return whole.toLocaleString();

        // Pad frac to full decimal width (e.g. "1000" → "000001000" for 9 decimals)
        const fracStr = frac.toString().padStart(decimals, "0");

        // Find the first non-zero digit and show up to 6 significant digits from there
        const firstNonZero = fracStr.search(/[1-9]/);
        if (firstNonZero === -1) return whole.toLocaleString();

        const end = Math.min(firstNonZero + 6, decimals);
        const sigDigits = fracStr.slice(0, end).replace(/0+$/, "");

        return sigDigits ? `${whole.toLocaleString()}.${sigDigits}` : whole.toLocaleString();
    } catch {
        return amount;
    }
};

const TokenAllocationChips: React.FC<{ allocations: TokenAllocation[] }> = ({ allocations }) => {
    const [showAll, setShowAll] = useState(false);
    if (allocations.length === 0) return <span className="text-secondary-text text-xs">—</span>;

    const visible = showAll ? allocations : allocations.slice(0, MAX_VISIBLE_TOKENS);
    const hidden = allocations.length - MAX_VISIBLE_TOKENS;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((a, i) => (
                <span
                    key={`${a.tokenAddress}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap"
                >
                    <span>{formatTokenAmount(a.amount, a.tokenDecimals)}</span>
                    <span className="text-primary/70">{a.tokenSymbol}</span>
                </span>
            ))}
            {!showAll && hidden > 0 && (
                <button
                    className="inline-flex items-center gap-0.5 text-xs text-secondary-text hover:text-foreground transition-colors"
                    onClick={() => setShowAll(true)}
                >
                    <EyeIcon className="size-3" />
                    +{hidden}
                </button>
            )}
        </div>
    );
};

/** Shows distinct network icons from the user's token allocations */
const UserNetworkIcons: React.FC<{ allocations: TokenAllocation[] }> = ({ allocations }) => {
    const networks = useMemo(() => {
        const seen = new Set<string>();
        return allocations
            .map((a) => getNetworkByChainId(a.chainId))
            .filter((n): n is typeof NETWORK_CONFIGS[number] => {
                if (!n || seen.has(n.id)) return false;
                seen.add(n.id);
                return true;
            });
    }, [allocations]);

    if (networks.length === 0) return <span className="text-secondary-text text-xs">—</span>;

    return (
        <div className="flex items-center gap-1.5">
            {networks.map((n) => (
                <NetworkImgIcon
                    key={n.id}
                    src={n.iconSrc}
                    alt={n.label}
                    className="size-5"
                />
            ))}
        </div>
    );
};

interface Props {
    data?: WhitelistUser[];
}

const AdminWhitelistUserTable: React.FC<Props> = ({ data }) => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    // Map single NetworkId → numeric chainId for the API (-1 for Solana)
    const chainIds = useMemo(() => {
        if (!filter.network) return undefined;
        const cfg = NETWORK_CONFIGS.find((n) => n.id === filter.network);
        const id = cfg?.appKitNetwork?.id;
        return [typeof id === "number" ? id : -1];
    }, [filter.network]);

    const tokenAddresses = filter.tokens.length > 0 ? filter.tokens : undefined;

    const { data: apiData, isLoading } = useGetWhitelistUsers({
        search: filter.text || undefined,
        chainIds,
        tokenAddresses,
    });

    const users = data ?? apiData?.users ?? [];
    const [editingUser, setEditingUser] = useState<WhitelistUser | null>(null);

    return (
        <div className="pb-10 pl-3.75 space-y-10">
            <Table className="table-auto">
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Network</TableHead>
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
                        users.map((user, index) => {
                            const isFirst = index === 0;
                            const status: UserStatus = "enabled";

                            return (
                                <TableRow
                                    key={user.address}
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

                                    {/* Network icons derived from allocations */}
                                    <TableCell>
                                        <UserNetworkIcons allocations={user.tokenAllocations} />
                                    </TableCell>

                                    {/* Description — token allocations */}
                                    <TableCell>
                                        <TokenAllocationChips allocations={user.tokenAllocations} />
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

                                    {/* Action */}
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <button
                                                className="text-secondary-text hover:text-foreground transition-colors"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <PencilIcon className="size-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>

            {!isLoading && users.length > 0 && (
                <p className="text-sm text-secondary-text pl-4">
                    Showing {users.length} of {apiData?.total ?? users.length} users
                </p>
            )}

            {!isLoading && users.length > 50 && (
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
                />
            )}
        </div>
    );
};

export default AdminWhitelistUserTable;
