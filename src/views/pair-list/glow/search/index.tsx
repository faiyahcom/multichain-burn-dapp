import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import TokenListGlow from "@/components/common/glow/token-list";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

export const searchContainerId = "pair-list-search-container";

const PairListGlowSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  return (
    <>
      <TokenListGlow
        variant="pair"
        onTokenClick={(token) => {
          setFilter({
            text: token.customSymbol ?? token.symbol,
          });
        }}
      />
      <GlowContainer
        variant="pair"
        className="flex flex-col gap-3 p-3 md:p-6 xl:flex-row"
        id={searchContainerId}
      >
        <SearchTextDebouncedInput
          variant="pair"
          inputProps={{
            placeholder: "Search",
          }}
          value={filter.text}
          onValueChange={(value) => setFilter({ text: value })}
        />
        <NetworkMultipleSelect
          variant="pair"
          selected={filter.network}
          onChange={(value) => setFilter({ network: value })}
          otherProps={{
            classNames: {
              btn: "xl:max-w-[400px]",
            },
          }}
        />
        <SortSelect
          options={["volume", "liquidity"]}
          sortBy={filter.sortBy ?? "none"}
          sortOrder={filter.sortOrder}
          setSortBy={(sortBy) => setFilter({ sortBy })}
          setSortOrder={(sortOrder) => setFilter({ sortOrder })}
          defaultSortBy="volume"
          variant="pair"
          classNames={{
            btn: "max-xl:w-full",
          }}
        />
        <LayoutPicker
          layout={filter.listLayout}
          setLayout={(layout) => setFilter({ listLayout: layout })}
          variant="pair"
          hasContainer
          classNames={{
            container: "max-xl:w-full",
            btn: "max-xl:flex-1",
          }}
        />
      </GlowContainer>
    </>
  );
};

export default PairListGlowSearch;
