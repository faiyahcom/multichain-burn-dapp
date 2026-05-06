import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import RangeDatePicker from "@/components/common/range-date-picker";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import WhitelistTokenMultipleSelect from "@/components/common/whitelist-token-multiple-select";
import { Button } from "@/components/ui/button";
import {
  useMasterPoolManagementSwapSearchFilterStore,
  initialMasterPoolManagementSwapSearchFilter,
  isFilterChanged,
} from "@/stores/admin/master-pool-management/swap/search-filter-store";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  swapPoolStatuses,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";

const AdminMasterPoolManagementSwapSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementSwapSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search...",
        }}
      />
      <WhitelistTokenMultipleSelect
        poolType={1}
        value={filter.tokens}
        onChange={(value) => setFilter({ tokens: value })}
      />
      <MultipleSelect
        options={swapPoolStatuses.map((status) => ({
          label: getPoolStatusLabel(status),
          value: status.toString(),
          icon: ({ className }) => (
            <LetterIcon
              letter={getPoolStatusLabel(status)[0]}
              color={getPoolStatusColor(status)}
              className={className}
            />
          ),
        }))}
        selected={filter.status}
        onChange={(value) => setFilter({ status: value as SwapPoolStatus[] })}
        placeholderMultiple="All Status"
        showIconsInTriggerIfAny={false}
      />
      <NetworkMultipleSelect
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
      />
      <RangeDatePicker
        value={filter.dateRange}
        onChange={(value) => setFilter({ dateRange: value })}
        filterByText="Date Filter"
      />
      <Button
        variant={"mb-clear-all"}
        size={"mb-btn"}
        onClick={() => {
          setFilter(initialMasterPoolManagementSwapSearchFilter);
        }}
        disabled={!isFilterChanged(filter)}
      >
        Clear All
      </Button>
    </div>
  );
};

export default AdminMasterPoolManagementSwapSearch;
