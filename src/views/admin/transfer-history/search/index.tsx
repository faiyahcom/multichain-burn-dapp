import DatePicker from "@/components/common/date-picker";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import type { SingleSelectOption } from "@/components/common/single-select";
import SingleSelect from "@/components/common/single-select";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useAdminTransferHistoryFilterStore } from "@/stores/admin/transfer-history/search-filter-store";

const AdminTransferHistorySearch = () => {
  const { filter, setFilter, errors } = useAdminTransferHistoryFilterStore();
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
    <div className="mb-4.25 space-y-3.75 px-4 md:px-13.5">
      <div className="flex flex-col justify-end gap-2.75 md:flex-row md:items-center">
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

      <div className="flex flex-col justify-start gap-2.75 md:flex-row md:items-center">
        <p className="text-13px">Amount</p>
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Min",
            type: "number",
            min: 0,
            onKeyDown: (e) => {
              // Prevent minus sign from being entered
              if (e.key === "-") {
                e.preventDefault();
              }
            },
            onPaste: (e) => {
              // Prevent minus sign from being entered
              const pasted = e.clipboardData?.getData("text");
              if (pasted?.includes("-")) {
                e.preventDefault();
              }
            },
          }}
          addons={null}
          value={filter.amountOutMin}
          onValueChange={(amountOutMin) => setFilter({ amountOutMin })}
          className="md:max-w-40"
        />
        <p className="text-13px">to</p>
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Max",
            type: "number",
            min: 0,
            onKeyDown: (e) => {
              // Prevent minus sign from being entered
              if (e.key === "-") {
                e.preventDefault();
              }
            },
            onPaste: (e) => {
              // Prevent minus sign from being entered
              const pasted = e.clipboardData?.getData("text");
              if (pasted?.includes("-")) {
                e.preventDefault();
              }
            },
          }}
          addons={null}
          value={filter.amountOutMax}
          onValueChange={(amountOutMax) => setFilter({ amountOutMax })}
          className="md:max-w-40"
        />
        {errors?.amountOutRange && (
          <em className="text-xs text-error">{errors.amountOutRange}</em>
        )}
      </div>

      <div className="flex flex-col justify-start gap-2.75 md:flex-row md:items-center">
        <p className="text-13px">Date</p>
        <DatePicker
          value={filter.dateFrom}
          onChange={(dateFrom) => setFilter({ dateFrom })}
          calendarProps={{
            disabled: filter.dateTo ? { after: filter.dateTo } : undefined,
          }}
        />
        <p className="text-13px">to</p>
        <DatePicker
          value={filter.dateTo}
          onChange={(dateTo) => setFilter({ dateTo })}
          calendarProps={{
            disabled: filter.dateFrom ? { before: filter.dateFrom } : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AdminTransferHistorySearch;
