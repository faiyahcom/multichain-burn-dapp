import DatePicker from "@/components/common/date-picker";
import MultipleTokenSelect from "@/components/common/multiple-token-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import type { SingleSelectOption } from "@/components/common/single-select";
import SingleSelect from "@/components/common/single-select";
import { InputGroupAddon } from "@/components/ui/input-group";
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import { useAdminTransferHistoryFilterStore } from "@/stores/admin/transfer-history/search-filter-store-v2";
import { DollarSignIcon } from "lucide-react";

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
        <MultipleTokenSelect
          selected={filter.tokens}
          onChange={(tokens) => setFilter({ tokens })}
          whitelistTokensRequest={{
            chainIds: networkIdToChainId(filter.networkId),
          }}
        />

        <SingleSelect
          options={networkOptions}
          selected={filter.networkId}
          onChange={(network) => setFilter({ networkId: network, tokens: [] })}
          placeholder="Network"
        />

        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search by name, email, wallet address, or pool name",
          }}
          value={filter.text}
          onValueChange={(text) => setFilter({ text })}
          className="max-w-100"
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
          addons={
            <InputGroupAddon align={"inline-start"}>
              <DollarSignIcon />
            </InputGroupAddon>
          }
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
          addons={
            <InputGroupAddon align={"inline-start"}>
              <DollarSignIcon />
            </InputGroupAddon>
          }
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
