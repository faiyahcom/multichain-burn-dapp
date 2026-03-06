import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { NETWORK_CONFIGS } from "@/config/networks";
import type { SortBy, SortOrder } from "@/types/common";

export interface IMyParticipatedMenu {
    statusOptions: MultipleSelectOption[];
    selectedStatuses: string[];
    onStatusChange: (value: string[]) => void;
    selectedNetworks: string[];
    onNetworkChange: (value: string[]) => void;
    searchText: string;
    onSearchChange: (value: string) => void;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSortByChange: (sortBy: SortBy) => void;
    onSortOrderChange: (sortOrder: SortOrder) => void;
}

const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map((network) => ({
    label: network.label,
    value: network.id,
    icon: ({ className }: { className?: string }) => (
        <NetworkImgIcon src={network.iconSrc} className={className} alt={network.label} />
    ),
}));

const SORT_OPTIONS: SortBy[] = ["timestamp", "tvl"];

function MyParticipatedMenu({
    statusOptions,
    selectedStatuses,
    onStatusChange,
    selectedNetworks,
    onNetworkChange,
    searchText,
    onSearchChange,
    sortBy,
    sortOrder,
    onSortByChange,
    onSortOrderChange,
}: IMyParticipatedMenu) {
    return (
        <div className="space-y-9.5 pt-12.75 pr-12.75 pl-21">
            <h1 className="text-3xl font-semibold">My Participated Pools</h1>
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 w-full justify-end">
                    <MultipleSelect
                        options={statusOptions}
                        selected={selectedStatuses}
                        onChange={onStatusChange}
                        showIconsInTriggerIfAny={false}
                        placeholder="Status"
                        placeholderMultiple="Status"
                        classNames={{ btn: "max-w-50" }}
                    />
                    <MultipleSelect
                        options={networkOptions}
                        placeholder="Network"
                        selected={selectedNetworks}
                        onChange={onNetworkChange}
                    />
                    <SortSelect
                        options={SORT_OPTIONS}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        setSortBy={onSortByChange}
                        setSortOrder={onSortOrderChange}
                    />
                    <SearchTextDebouncedInput
                        inputProps={{ placeholder: "Search Pools..." }}
                        value={searchText}
                        onValueChange={onSearchChange}
                        className="sm:max-w-62.5"
                    />
                </div>
            </div>
        </div>
    );
}

export default MyParticipatedMenu;