import DatePicker from "@/components/common/date-picker";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import type { SingleSelectOption } from "@/components/common/single-select";
import SingleSelect from "@/components/common/single-select";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useAdminTransferHistoryFilterStore } from "@/stores/admin/transfer-history/search-filter-store";

const AdminTransferHistorySearch = () => {
  const { filter, setFilter } = useAdminTransferHistoryFilterStore();
  const networkOptions: SingleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      triggerLabel: network.shortLabel,
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
    <div className="mb-4.25 space-y-3.75 px-13.5">
      <div className="flex items-center justify-end gap-2.75">
        <SearchTextDebouncedInput
          inputProps={{
            placeholder:
              "Search by name, email, wallet address, pool name, token address, or symbol",
          }}
          value={filter.text}
          onValueChange={(text) => setFilter({ text })}
        />
        <SingleSelect
          options={networkOptions}
          selected={filter.networkId}
          onChange={(network) => setFilter({ networkId: network, tokens: [] })}
          placeholder="Network"
        />
      </div>

      <div className="flex items-center justify-start gap-2.75">
        <p className="text-13px">Amount</p>
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Min",
            type: "number",
            min: 0,
          }}
          addons={null}
          value={filter.amountOutMin}
          onValueChange={(amountOutMin) => setFilter({ amountOutMin })}
          className="max-w-40"
        />
        <p className="text-13px">to</p>
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Max",
            type: "number",
            min: 0,
          }}
          addons={null}
          value={filter.amountOutMax}
          onValueChange={(amountOutMax) => setFilter({ amountOutMax })}
          className="max-w-40"
        />
      </div>

      <div className="flex items-center justify-start gap-2.75">
        <p className="text-13px">Date</p>
        <DatePicker
          value={filter.dateFrom}
          onChange={(dateFrom) => setFilter({ dateFrom })}
        />
        <p className="text-13px">to</p>
        <DatePicker
          value={filter.dateTo}
          onChange={(dateTo) => setFilter({ dateTo })}
        />
      </div>
    </div>
  );
};

export default AdminTransferHistorySearch;
