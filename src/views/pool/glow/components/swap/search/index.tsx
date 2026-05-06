import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import { useSwapPoolListSearchFilterStore } from "@/stores/pool-list/search-filter-store";

const SwapSearch = () => {
  const { filter, setFilter } = useSwapPoolListSearchFilterStore();

  return (
    <GlowContainer
      variant="swap"
      className="flex flex-col gap-3 p-3 md:p-6 xl:flex-row"
    >
      <SearchTextDebouncedInput
        variant="swap"
        inputProps={{
          placeholder: "Search",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
      />
      <NetworkMultipleSelect
        variant="swap"
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
        otherProps={{
          classNames: {
            btn: "xl:max-w-100",
          },
        }}
      />
      <SortSelect
        options={["liquidity"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy="liquidity"
        variant="swap"
        classNames={{
          btn: "max-xl:w-full",
        }}
      />
      <LayoutPicker
        layout={filter.listLayout}
        setLayout={(layout) => setFilter({ listLayout: layout })}
        variant="swap"
        hasContainer
        classNames={{
          container: "max-xl:w-full",
          btn: "max-xl:flex-1",
        }}
      />
    </GlowContainer>
  );
};

export default SwapSearch;
