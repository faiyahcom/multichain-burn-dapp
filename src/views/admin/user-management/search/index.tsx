import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import RangeDatePicker from "@/components/common/range-date-picker";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { Button } from "@/components/ui/button";
import {
  initialAdminUserManagementSearchFilter,
  useAdminUserManagementSearchFilterStore,
} from "@/stores/admin/user-management/search-filter-store";

const AdminUserManagementSearch = () => {
  const { filter, setFilter } = useAdminUserManagementSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 bg-mb-gray-fa p-3 sm:gap-2 sm:p-6 md:items-center lg:flex-row">
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
        filterByText="Joined Date"
        classNames={{
          btn: "max-lg:w-full",
        }}
      />
      <NetworkMultipleSelect
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
        otherProps={{
          classNames: {
            btn: "max-lg:w-full",
          },
        }}
      />
      <Button
        variant={"mb-inactive"}
        size={"mb-btn"}
        className="text-sm font-bold text-active max-lg:w-full"
        onClick={() => {
          setFilter(initialAdminUserManagementSearchFilter);
        }}
      >
        Clear All
      </Button>
    </div>
  );
};

export default AdminUserManagementSearch;
