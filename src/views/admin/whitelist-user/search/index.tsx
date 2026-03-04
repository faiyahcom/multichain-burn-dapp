import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useGetWhitelistUsers } from "@/services/queries/queries";
import { useAdminWhitelistUserSearchFilterStore } from "@/stores/admin/whitelist-user/search-filter-store";
import {
    userStatus,
    userStatusLabels,
    type UserStatus,
} from "@/types/admin/whitelist-user";
import AdminWhitelistUserDialogCreate from "../dialog/create";
import AdminWhitelistUserSearchStatusPicker from "./status-picker";

// TODO: replace with real token options from API
const tokenOptions: MultipleSelectOption[] = [
    { label: "USDC", value: "usdc" },
    { label: "USDT", value: "usdt" },
    { label: "DAI", value: "dai" },
    { label: "WBTC", value: "wbtc" },
    { label: "ETH", value: "eth" },
];

const AdminWhitelistUserSearch = () => {
    const { filter, setFilter } = useAdminWhitelistUserSearchFilterStore();

    // Fetch without search text so counts don't change while the user is typing
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
                        onChange={(value) => setFilter({ network: value })}
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
