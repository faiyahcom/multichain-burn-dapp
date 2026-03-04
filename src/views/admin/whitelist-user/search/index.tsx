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


const AdminWhitelistUserSearch = () => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    // Stable counts (no text filter)
    const { data: countData } = useGetWhitelistUsers();
    const total = (countData?.countEnable ?? 0) + (countData?.countDisable ?? 0);
    const statusCounts = [total, countData?.countEnable ?? 0, countData?.countDisable ?? 0];

    const statusOptions = userStatus.map((status) => ({
        label: userStatusLabels[status],
        value: status,
    }));

    const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map(
        (network) => ({
            label: network.label,
            value: network.id,
            icon: ({ className }: { className?: string }) => (
                <NetworkImgIcon
                    src={network.iconSrc}
                    className={className}
                    alt={network.label}
                />
            ),
        }),
    );

    // Build a chainId → networkId lookup from NETWORK_CONFIGS
    const chainIdToNetworkId = useMemo(() => {
        const map = new Map<string, string>();
        NETWORK_CONFIGS.forEach((n) => {
            if ("id" in n.appKitNetwork) {
                map.set(String(n.appKitNetwork.id), n.id);
            }
        });
        return map;
    }, []);

    // Fetch all whitelisted tokens
    const { data: tokensData } = useGetWhitelistTokens();

    // Filter tokens by selected networks (if any selected); de-dupe by address
    const tokenOptions: MultipleSelectOption[] = useMemo(() => {
        const tokens = tokensData?.whitelistTokens ?? [];
        const filtered =
            filter.network.length === 0
                ? tokens
                : tokens.filter((t) =>
                    filter.network.includes(chainIdToNetworkId.get(t.chainId) ?? ""),
                );
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
                        placeholder="All Tokens"
                        selected={filter.tokens}
                        onChange={(value) => setFilter({ tokens: value })}
                    />
                    <MultipleSelect
                        options={networkOptions}
                        placeholder="Network"
                        selected={filter.network}
                        onChange={(value) => {
                            setFilter({ network: value });
                            // Clear token selections that no longer belong to the new network set
                            if (filter.tokens.length > 0) {
                                const tokens = tokensData?.whitelistTokens ?? [];
                                const valid = new Set(
                                    value.length === 0
                                        ? tokens.map((t) => t.address)
                                        : tokens
                                            .filter((t) =>
                                                value.includes(chainIdToNetworkId.get(t.chainId) ?? ""),
                                            )
                                            .map((t) => t.address),
                                );
                                setFilter({
                                    tokens: filter.tokens.filter((addr) => valid.has(addr)),
                                });
                            }
                        }}
                    />
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
