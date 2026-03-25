import GlowContainer from "@/components/common/glow/container";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import TokenListGlow from "@/components/common/glow/token-list";
import { usePairListSearchFilterStore } from "@/stores/pair-list/search-filter-store";

const PairListGlowSearch = () => {
  const { filter, setFilter } = usePairListSearchFilterStore();
  return (
    <>
      <TokenListGlow variant="pair" />
      <GlowContainer
        variant="pair"
        className="flex flex-col gap-3 p-3 md:p-6 lg:flex-row"
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
        />
      </GlowContainer>
    </>
  );
};

export default PairListGlowSearch;
