import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import TokenListGlow from "@/components/common/glow/token-list";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

const PairListGlowSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  return (
    <>
      <TokenListGlow
        variant="pair"
        onTokenClick={(token) => {
          setFilter({
            text: token.address,
          });
        }}
      />
      <GlowContainer
        variant="pair"
        className="flex flex-col gap-3 p-3 md:p-6 xl:flex-row"
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
              btn: "max-w-[400px]",
            },
          }}
        />
        <SortSelect
          options={["volume", "tvl"]}
          sortBy={filter.sortBy ?? "none"}
          sortOrder={filter.sortOrder}
          setSortBy={(sortBy) => setFilter({ sortBy })}
          setSortOrder={(sortOrder) => setFilter({ sortOrder })}
          defaultSortBy="volume"
          variant="pair"
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
