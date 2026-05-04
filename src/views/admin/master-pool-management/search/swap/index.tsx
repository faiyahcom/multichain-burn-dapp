import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import {
  useMasterPoolManagementSwapSearchFilterStore,
  initialMasterPoolManagementSwapSearchFilter,
} from "@/stores/admin/master-pool-management/swap/search-filter-store";

const AdminMasterPoolManagementSwapSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementSwapSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search...",
        }}
      />
    </div>
  );
};

export default AdminMasterPoolManagementSwapSearch;
