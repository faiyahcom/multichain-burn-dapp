import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useGetWhitelistTokens, useGetWhitelistUsers } from "@/services/queries/queries";
import { useAdminWhitelistUserSearchFilterStore } from "@/stores/admin/whitelist-user/search-filter-store";
import {
    userStatus,
    userStatusLabels,
    type UserStatus,
} from "@/types/admin/whitelist-user";
import AdminWhitelistUserDialogCreate from "../dialog/create";
import AdminWhitelistUserSearchStatusPicker from "./status-picker";
import { useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const AdminWhitelistUserSearch = () => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    // Stable counts (no text filter)
    const { data: countData } = useGetWhitelistUsers({});
    const total = (countData?.countEnable ?? 0) + (countData?.countDisable ?? 0);
    const statusCounts = [total, countData?.countEnable ?? 0, countData?.countDisable ?? 0];

    const statusOptions = userStatus.map((status) => ({
        label: userStatusLabels[status],
        value: status,
    }));

    // Build chainId → networkId lookup
    const chainIdToNetworkId = useMemo(() => {
        const map = new Map<string, string>();
        NETWORK_CONFIGS.forEach((n) => {
            const id = n.appKitNetwork?.id;
            map.set(typeof id === "number" ? String(id) : "-1", n.id);
        });
        return map;
    }, []);

    // Fetch all whitelisted tokens
    const { data: tokensData, isLoading: isTokensLoading } = useGetWhitelistTokens();

    // Filter tokens by the selected network (single value)
    const tokenOptions: MultipleSelectOption[] = useMemo(() => {
        const tokens = tokensData?.whitelistTokens ?? [];
        const filtered = filter.network
            ? tokens.filter((t) =>
                chainIdToNetworkId.get(t.chainId) === filter.network,
            )
            : tokens;
        return filtered.map((t) => ({
            label: t.customSymbol || t.symbol || t.name,
            value: t.address,
        }));
    }, [tokensData, filter.network, chainIdToNetworkId]);

    return (
        <div className="space-y-4 pt-12.75 pr-13.5 pl-21">
            {/* Header + summary + add button */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold">Whitelist Users</h1>
                    <p className="text-base text-secondary-text">
                        Manage users eligible for token transfers
                    </p>
                </div>
                <AdminWhitelistUserDialogCreate />
            </div>

            {/* status + token + network + text */}
            <div className="flex items-center justify-between gap-4">
                <AdminWhitelistUserSearchStatusPicker
                    options={statusOptions}
                    counts={statusCounts}
                    selected={filter.status}
                    onChange={(status) => {
                        if (status === undefined) return;
                        setFilter({ status: status as UserStatus });
                    }}
                />
                <div className="flex items-center gap-3">
                    <MultipleSelect
                        options={tokenOptions}
                        placeholder={
                            isTokensLoading
                                ? "Loading tokens..."
                                : tokenOptions.length === 0
                                    ? filter.network
                                        ? "No tokens for selected network"
                                        : "No tokens available"
                                    : "All Tokens"
                        }
                        selected={filter.tokens}
                        onChange={(value) => setFilter({ tokens: value })}
                    />

                    {/* Single-select network */}
                    <Select
                        value={filter.network || "__all__"}
                        onValueChange={(value) => {
                            const network = value === "__all__" ? "" : value;
                            setFilter({ network, tokens: [] }); // clear token selection on network change
                        }}
                    >
                        <SelectTrigger className="h-9 min-w-32 border-border">
                            <SelectValue placeholder="Network" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">All Networks</SelectItem>
                            {NETWORK_CONFIGS.map((n) => (
                                <SelectItem key={n.id} value={n.id}>
                                    <span className="flex items-center gap-2">
                                        <NetworkImgIcon
                                            src={n.iconSrc}
                                            alt={n.label}
                                            className="size-4"
                                        />
                                        {n.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <SearchTextDebouncedInput
                        inputProps={{
                            placeholder: "Search by name, email, or wallet address",
                        }}
                        value={filter.text}
                        onValueChange={(value) => setFilter({ text: value })}
                        className="sm:max-w-80.75"
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminWhitelistUserSearch;
