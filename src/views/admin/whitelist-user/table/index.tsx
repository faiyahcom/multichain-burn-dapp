import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import CustomPagination from "@/components/common/pagination";
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
import { useState } from "react";
import AdminWhitelistUserDialogEdit from "../dialog/edit";
import { NETWORK_CONFIGS } from "@/config/networks";

const MAX_VISIBLE_TOKENS = 3;

/** Formats a raw BigInt amount string using token decimals into a display value */
const formatTokenAmount = (amount: string, decimals: number): string => {
    try {
        const raw = BigInt(amount);
        const divisor = BigInt(10 ** decimals);
        const whole = raw / divisor;
        const frac = raw % divisor;
        if (frac === 0n) return whole.toLocaleString();
        // Show up to 2 decimal places
        const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2).replace(/0+$/, "");
        return fracStr ? `${whole.toLocaleString()}.${fracStr}` : whole.toLocaleString();
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
            {visible.map((a) => (
                <span
                    key={a.tokenAddress}
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

interface Props {
    data?: WhitelistUser[];
}

const AdminWhitelistUserTable: React.FC<Props> = ({ data }) => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    // Map NetworkId strings → numeric chainIds for the API (-1 = Solana)
    const chainIds = filter.network.length > 0
        ? filter.network.map((networkId) => {
            const cfg = NETWORK_CONFIGS.find((n) => n.id === networkId);
            const id = cfg?.appKitNetwork?.id;
            return typeof id === "number" ? id : -1; // -1 for Solana
        })
        : undefined;

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
                        <TableHead>Description</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                        <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-secondary-text">
                                Loading...
                            </TableCell>
                        </TableRow>
                    )}

                    {!isLoading && users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="py-10 text-center text-secondary-text">
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
                                            <p
                                                className={cn("text-base font-semibold", {
                                                    "text-primary": isFirst,
                                                })}
                                            >
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
                                            classNames={{
                                                btn: "min-w-27 mx-auto",
                                            }}
                                        />
                                    </TableCell>

                                    {/* Address */}
                                    <TableCell>
                                        <CopyableText
                                            content={user.address}
                                            displayText={truncateString({ str: user.address })}
                                        />
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

                                    {/* Action = pencil only */}
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
