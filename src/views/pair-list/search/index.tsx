import LayoutPicker from "@/components/common/layout-picker";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

const PairListSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();

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
      <NetworkMultipleSelect
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
