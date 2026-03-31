import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import MultipleSelect from "@/components/common/glow/multiple-select";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import { useBurnPoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";
import {
  burnPoolStatusLabels,
  userViewBurnPoolStatuses,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";

const BurnSearch = () => {
  const { filter, setFilter } = useBurnPoolListSearchFilterStore();

  const statusOptions = userViewBurnPoolStatuses.map((status) => ({
    label: burnPoolStatusLabels[status],
    value: status,
  }));

  return (
    <GlowContainer
      variant="burn"
      className="flex flex-col gap-3 p-3 md:p-6 xl:flex-row"
    >
      <SearchTextDebouncedInput
        variant="burn"
        inputProps={{
          placeholder: "Search",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
      />
      <NetworkMultipleSelect
        variant="burn"
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
        otherProps={{
          classNames: {
            btn: "xl:max-w-[400px]",
            content: "font-inter",
          },
        }}
      />
      <MultipleSelect
        variant="burn"
        options={statusOptions}
        selected={filter.status as string[]}
        onChange={(value) => setFilter({ status: value as BurnPoolStatus[] })}
        showIconsInTriggerIfAny={false}
        placeholder="Status"
        placeholderMultiple="Status"
        classNames={{
          btn: "w-full xl:max-w-50",
          content: "font-inter",
        }}
      />
      <SortSelect
        options={["volume", "liquidity"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy="volume"
        variant="burn"
        classNames={{
          content: "font-inter",
          btn: "w-full xl:max-w-50",
        }}
      />
      <LayoutPicker
        layout={filter.listLayout}
        setLayout={(layout) => setFilter({ listLayout: layout })}
        variant="burn"
        hasContainer
        classNames={{
          container: "max-xl:w-full",
          btn: "max-xl:flex-1",
        }}
      />
    </GlowContainer>
  );
};

export default BurnSearch;
