import MultipleSelect, {
  type MultipleSelectOption,
} from "@/components/common/multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import NetworkIcon from "@/components/layout/header/network-icon";
import { NETWORK_CONFIGS } from "@/config/networks";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

const PairListSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  const networkOptions: MultipleSelectOption[] = NETWORK_CONFIGS.map(
    (network) => ({
      label: network.label,
      value: network.id,
      icon: ({ className }: { className?: string }) => (
        <NetworkIcon networkId={network.id} className={className} />
      ),
    }),
  );

  return (
    <div className="flex items-center justify-end gap-2.5">
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search pair...",
        }}
      />
      <MultipleSelect
        options={networkOptions}
        placeholder="Network"
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
      />
    </div>
  );
};

export default PairListSearch;
