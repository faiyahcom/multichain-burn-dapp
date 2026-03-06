import LayoutPicker from "@/components/common/layout-picker";
import MultipleSelect, {
  type MultipleSelectOption,
} from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { NETWORK_CONFIGS } from "@/config/networks";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

const PairListSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
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
    <div className="flex items-center justify-end gap-2.5 pr-14">
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search pair...",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        className="sm:max-w-62.5"
      />
      <MultipleSelect
        options={networkOptions}
        placeholder="Network"
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
      />
      <SortSelect
        options={["volume", "tvl"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy="volume"
      />
      <LayoutPicker
        layout={filter.listLayout}
        setLayout={(layout) => setFilter({ listLayout: layout })}
      />
    </div>
  );
};

export default PairListSearch;
