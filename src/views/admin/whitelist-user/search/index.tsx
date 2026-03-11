import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { ArrowIcon } from "@/components/common/arrow-icon";
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
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ─── Network single-select (styled like MultipleSelect) ─────────────────────
interface NetworkSelectProps {
    value: string;
    onChange: (networkId: string) => void;
}

const NetworkSelect: React.FC<NetworkSelectProps> = ({ value, onChange }) => {
    const [open, setOpen] = useState(false);

    const selectedCfg = NETWORK_CONFIGS.find((n) => n.id === value);

    const handleSelect = (networkId: string) => {
        onChange(networkId);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={selectedCfg ? "mb-active" : "mb-inactive"}
                    size="mb-btn"
                >
                    <div className="size-2.5" />
                    {selectedCfg ? (
                        <span className="flex items-center gap-1.75">
                            <NetworkImgIcon
                                src={selectedCfg.iconSrc}
                                alt={selectedCfg.label}
                                className="size-5"
                            />
                            <span>{selectedCfg.label}</span>
                        </span>
                    ) : (
                        <span>Network</span>
                    )}
                    <ArrowIcon direction="down" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="space-y-1 pb-2.5"
                align="start"
                style={{ maxHeight: "var(--radix-popover-content-available-height)" }}
            >
                <PopoverHeader className="sr-only">
                    <PopoverTitle>Select Network</PopoverTitle>
                    <PopoverDescription>Choose a network to filter by</PopoverDescription>
                </PopoverHeader>

                {NETWORK_CONFIGS.map((n) => (
                    <NetworkOption
                        key={n.id}
                        label={n.label}
                        iconSrc={n.iconSrc}
                        selected={value === n.id}
                        onClick={() => handleSelect(n.id)}
                    />
                ))}
            </PopoverContent>
        </Popover>
    );
};

interface NetworkOptionProps {
    label: string;
    iconSrc?: string;
    selected: boolean;
    onClick: () => void;
}

const NetworkOption: React.FC<NetworkOptionProps> = ({
    label,
    iconSrc,
    selected,
    onClick,
}) => (
    <div
        className={cn(
            "flex cursor-pointer items-stretch rounded-5px transition-all overflow-hidden",
            selected ? "bg-[#DEE4F6]" : "bg-primary-foreground",
        )}
        onClick={onClick}
    >
        {/* Active bar — flush to left/top/bottom, no padding */}
        <div
            className={cn(
                "w-1.75 shrink-0 rounded-r-full transition-colors",
                selected ? "bg-active" : "bg-transparent",
            )}
        />

        {/* Content with its own padding */}
        <div className="flex items-center gap-2.5 px-3 py-2">
            {iconSrc ? (
                <NetworkImgIcon src={iconSrc} alt={label} className="size-7.75 rounded-full" />
            ) : (
                <div className="size-7.75" />
            )}
            <span
                className={cn(
                    "text-15px font-medium select-none transition-colors",
                    selected && "text-active font-bold",
                )}
            >
                {label}
            </span>
        </div>
    </div>
);

// ─── Main search component ───────────────────────────────────────────────────
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

    // Resolve the active network's backendChainId for the API query
    const activeChainId = useMemo(() => {
        if (!filter.network) return undefined;
        return NETWORK_CONFIGS.find((n) => n.id === filter.network)?.backendChainId;
    }, [filter.network]);

    // Fetch tokens for the active network directly from the API (server-side filter)
    const { data: tokensData, isLoading: isTokensLoading } = useGetWhitelistTokens(
        activeChainId ? { chainIds: activeChainId } : undefined,
    );

    // Map fetched tokens to select options (already filtered by network via API)
    const tokenOptions: MultipleSelectOption[] = useMemo(() => {
        const tokens = tokensData?.whitelistTokens ?? [];
        return tokens.map((t) => ({
            label: t.customSymbol || t.symbol || t.name,
            value: t.address,
        }));
    }, [tokensData]);

    // Auto-select all tokens for the active network on initial load and network change
    useEffect(() => {
        if (isTokensLoading) return;
        const allAddresses = (tokensData?.whitelistTokens ?? []).map((t) => t.address);
        setFilter({ tokens: allAddresses });
    }, [tokensData]);  // eslint-disable-line react-hooks/exhaustive-deps

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
                        placeholderMultiple="All Tokens"
                        selected={filter.tokens}
                        onChange={(value) => setFilter({ tokens: value })}
                    />

                    <NetworkSelect
                        value={filter.network}
                        onChange={(network) => setFilter({ network, tokens: [] })}
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
