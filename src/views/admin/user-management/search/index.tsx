import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { useAdminUserManagementSearchFilterStore } from "@/stores/admin/user-management/search-filter-store";

const AdminUserManagementSearch = () => {
  const { filter, setFilter } = useAdminUserManagementSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 bg-mb-gray-fa p-3 sm:gap-2 sm:p-6 md:flex-row md:items-center">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search by nickname or wallet address...",
        }}
      />
    </div>
  );
};

export default AdminUserManagementSearch;
