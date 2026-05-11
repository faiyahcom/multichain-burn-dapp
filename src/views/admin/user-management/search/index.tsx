import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import RangeDatePicker from "@/components/common/range-date-picker";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { Button } from "@/components/ui/button";
import {
  initialAdminUserManagementSearchFilter,
  isFilterChanged,
  useAdminUserManagementSearchFilterStore,
} from "@/stores/admin/user-management/search-filter-store";

const AdminUserManagementSearch = () => {
  const { filter, setFilter } = useAdminUserManagementSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 bg-mb-gray-fa p-3 sm:gap-2 sm:p-6 lg:flex-row lg:items-center">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search by nickname or wallet address...",
        }}
      />
      <RangeDatePicker
        value={filter.dateRange}
        onChange={(value) => setFilter({ dateRange: value })}
        filterByText="Filter by Joined Date"
      />
      <NetworkMultipleSelect
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
      />
      <Button
        variant={"mb-clear-all"}
        size={"mb-btn"}
        onClick={() => {
          setFilter(initialAdminUserManagementSearchFilter);
        }}
        disabled={!isFilterChanged(filter)}
      >
        Clear All
      </Button>
    </div>
  );
};

export default AdminUserManagementSearch;
