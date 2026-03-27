import LayoutPicker from "@/components/common/layout-picker";
import LetterIcon from "@/components/common/letter-icon";
import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import { PoolKindCodeEnum } from "@/types/pool";
import {
  burnPoolStatusColors,
  burnPoolStatusLabels,
  swapPoolStatusColors,
  swapPoolStatusLabels,
  userViewBurnPoolStatuses,
  userViewSwapPoolStatuses,
  type BurnPoolStatus,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";

const PairDetailDetailSearch = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();
  const statusOptions: MultipleSelectOption[] =
    filter.type === PoolKindCodeEnum.Swap
      ? userViewSwapPoolStatuses.map((status) => ({
          label: swapPoolStatusLabels[status],
          value: status,
          icon: ({ className }: { className?: string }) => (
            <LetterIcon
              letter={status.slice(0, 1).toUpperCase()}
              color={swapPoolStatusColors[status]}
              className={className}
            />
          ),
        }))
      : userViewBurnPoolStatuses.map((status) => ({
          label: burnPoolStatusLabels[status],
          value: status,
          icon: ({ className }: { className?: string }) => (
            <LetterIcon
              letter={status.slice(0, 1).toUpperCase()}
              color={burnPoolStatusColors[status]}
              className={className}
            />
          ),
        }));

  return (
    <div className="flex items-center justify-end gap-2.25 pr-8.5">
      <MultipleSelect
        options={statusOptions}
        selected={filter.status}
        onChange={(value) =>
          setFilter({
            status: value as (SwapPoolStatus | BurnPoolStatus)[],
          })
        }
        showIconsInTriggerIfAny={false}
        placeholder="Status"
        placeholderMultiple="Status"
        classNames={{
          btn: "max-w-50",
        }}
      />
      <SortSelect
        options={["volume", "tvl", "timestamp"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy="volume"
      />
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search by pool name or pool address...",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        className="sm:max-w-75.75"
      />
      <LayoutPicker
        layout={filter.listLayout}
        setLayout={(layout) => setFilter({ listLayout: layout })}
      />
    </div>
  );
};

export default PairDetailDetailSearch;
