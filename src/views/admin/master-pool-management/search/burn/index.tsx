import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { useMasterPoolManagementBurnSearchFilterStore } from "@/stores/admin/master-pool-management/burn/search-filter-store";

const AdminMasterPoolManagementBurnSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementBurnSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search...",
        }}
        className="md:basis-1/2"
      />
    </div>
  );
};

export default AdminMasterPoolManagementBurnSearch;
