import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import { useAdminManagementSearchFilterStore } from "@/stores/admin/admin-management/search-filter-store";
import {
  adminManagementRoleLabels,
  adminManagementRoles,
  type AdminManagementRole,
} from "@/types/admin/admin-management";
import AdminManagementDialogCreate from "../dialog/create";

const roleOptions: MultipleSelectOption[] = adminManagementRoles.map((role) => ({
  label: adminManagementRoleLabels[role],
  value: role,
}));

const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map((network) => ({
  label: network.label,
  value: network.id,
  icon: ({ className }: { className?: string }) => (
    <NetworkImgIcon
      src={network.iconSrc}
      alt={network.label}
      className={className}
    />
  ),
}));

const AdminManagementSearch = () => {
  const { filter, setFilter } = useAdminManagementSearchFilterStore();

  return (
    <div className="space-y-4 pt-12.75 pr-13.5 pl-21">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Admin Management</h1>
          <p className="text-base text-secondary-text">
            Manage admin access, roles, and active permissions across networks.
          </p>
        </div>
        <AdminManagementDialogCreate />
      </div>

      <div className="flex items-center justify-end gap-3">
        <MultipleSelect
          options={roleOptions}
          selected={filter.roles}
          onChange={(value) =>
            setFilter({ roles: value as AdminManagementRole[] })
          }
          placeholder="Role"
          placeholderMultiple="All Role"
          classNames={{
            btn: "max-w-48",
            content: "w-60",
          }}
        />

        <MultipleSelect
          options={networkOptions}
          selected={filter.network}
          onChange={(value) => setFilter({ network: value as NetworkId[] })}
          placeholder="Network"
          placeholderMultiple="All Networks"
          classNames={{
            btn: "max-w-56",
            content: "w-68",
          }}
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
  );
};

export default AdminManagementSearch;
