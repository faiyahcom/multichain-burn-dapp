import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import {
  tokenStatus,
  tokenStatusLabels,
  type TokenStatus,
} from "@/types/admin/whitelist-token";
import AdminWhitelistTokenDialogCreate from "../dialog/create";
import AdminWhitelistTokenSearchStatusPicker from "./status-picker";

const AdminWhitelistTokenSearch = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const statusOptions = tokenStatus.map((status) => ({
    label: tokenStatusLabels[status],
    value: status,
  }));
  const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      icon: ({ className }: { className?: string }) => (
        <NetworkImgIcon
          src={network.iconSrc}
          className={className}
          alt={network.label}
        />
      ),
    }),
  );

  return (
    <div className="space-y-4 pt-12.75 pr-13.5 pl-21">
      {/* Header + summary + add button  */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Whitelist Token Management</h1>
          <div className="flex items-center gap-2.75 text-base font-semibold">
            {/* TODO: add actual summary */}
            <p className="text-mb-danger">5 tokens</p>
            <p className="text-mb-green">3 active</p>
          </div>
        </div>
        <AdminWhitelistTokenDialogCreate />
      </div>

      {/* status + network + text */}
      <div className="flex items-center justify-between gap-4">
        <AdminWhitelistTokenSearchStatusPicker
          options={statusOptions}
          counts={[5, 3, 2]} // TODO: add actual counts
          selected={filter.status}
          onChange={(status) => {
            if (status === undefined) return;
            setFilter({ status: status as TokenStatus });
          }}
        />
        <div className="flex items-center gap-3">
          <MultipleSelect
            options={networkOptions}
            placeholder="Network"
            selected={filter.network}
            onChange={(value) => setFilter({ network: value })}
          />
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Search by name, symbol, or address",
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

export default AdminWhitelistTokenSearch;
