import LetterIcon from "@/components/common/letter-icon";
import type { MultipleSelectOption } from "@/components/common/multiple-select";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkImgIcon from "@/components/common/network-img-icon";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SortSelect from "@/components/common/sort-select";
import { NETWORK_CONFIGS } from "@/config/networks";
import { useBurnPoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";
import {
  burnPoolStatusColors,
  burnPoolStatusLabels,
  userViewBurnPoolStatuses,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";

const BurnPoolListSearch = () => {
  const { filter, setFilter } = useBurnPoolListSearchFilterStore();

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
    <div className="mb-5 flex items-center justify-end gap-2.5 px-12.25">
      <SearchTextDebouncedInput
        inputProps={{
          placeholder: "Search Pools...",
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
      <SortSelect
        options={["tvl", "volume", "timestamp"]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        defaultSortBy="tvl"
      />
    </div>
  );
};

export default BurnPoolListSearch;
