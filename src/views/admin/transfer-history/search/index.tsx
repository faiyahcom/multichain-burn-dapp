import DatePicker from "@/components/common/date-picker";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import type { SingleSelectOption } from "@/components/common/single-select";
import SingleSelect from "@/components/common/single-select";
import { NumericInput } from "@/components/ui/numeric-input";
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
        <NumericInput
          placeholder="Min"
          value={filter.amountOutMin}
          onChange={(amountOutMin) => setFilter({ amountOutMin })}
          className="md:max-w-40"
        />
        <p className="text-13px">to</p>
        <NumericInput
          placeholder="Max"
          value={filter.amountOutMax}
          onChange={(amountOutMax) => setFilter({ amountOutMax })}
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
