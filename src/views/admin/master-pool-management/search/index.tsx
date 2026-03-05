import SingleSelect from "@/components/common/single-select";
import { useMasterPoolManagementSearchFilterStore } from "@/stores/admin/master-pool-management/search-filter-store";
import { poolTypeOptions } from "@/types/admin/master-pool-management";

const AdminMasterPoolManagementSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementSearchFilterStore();

  return (
    <div className="space-y-9.5 pt-12.75 pr-12.75 pl-21">
      <h1 className="text-3xl font-semibold">Master Pool Management</h1>
      <div className="flex items-center justify-between gap-2.5">
        <SingleSelect
          options={poolTypeOptions}
          selected={filter.type}
          onChange={(value) => setFilter({ type: value })}
          classNames={{
            content: "w-55.5",
            btn: "min-w-34",
          }}
        />
      </div>
    </div>
  );
};

export default AdminMasterPoolManagementSearch;
