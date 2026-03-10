import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { usePoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";
import {
  burnPoolStatusColors,
  burnPoolStatusLabels,
  userViewBurnPoolStatuses,
  type BurnPoolStatus,
  type PoolType,
} from "@/types/admin/master-pool-management";

interface Props {
  poolType: PoolType;
}

const PoolListSearch: React.FC<Props> = ({ poolType }) => {
  const { filter, setFilter } = usePoolListSearchFilterStore(poolType);

  const statusOptions = userViewBurnPoolStatuses.map((status) => ({
    label: burnPoolStatusLabels[status],
    value: status,
    icon: ({ className }: { className?: string }) => (
      <LetterIcon
        letter={burnPoolStatusLabels[status].charAt(0).toUpperCase()}
        className={className}
        color={burnPoolStatusColors[status]}
      />
    ),
  }));

  return (
    <div className="mb-5 flex items-center justify-end gap-2.5 px-12.25">
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search Pools...",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        className="sm:max-w-62.5"
      />
      <NetworkMultipleSelect
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
      />
      {/* Swap pool only allow status ongoing so the status select is hidden */}
      {poolType === 0 && (
        <MultipleSelect
          options={statusOptions}
          selected={filter.status}
          onChange={(value) =>
            setFilter({
              status: value as BurnPoolStatus[],
            })
          }
          showIconsInTriggerIfAny={false}
          placeholder="Status"
          placeholderMultiple="Status"
          classNames={{
            btn: "max-w-50",
          }}
        />
      )}
      <SortSelect
        options={["tvl", "volume", "timestamp"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy={poolType === 0 ? "tvl" : "timestamp"}
      />
    </div>
  );
};

export default PoolListSearch;
