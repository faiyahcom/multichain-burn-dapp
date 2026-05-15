import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import MultipleSelect from "@/components/common/glow/multiple-select";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import { useLaunchpadPoolListSearchFilterStore } from "@/stores/pool-list/search-filter-store";
import {
  launchpadPoolStatusLabels,
  userViewLaunchpadPoolStatuses,
  type LaunchpadPoolStatus,
} from "@/types/admin/master-pool-management";

const LaunchpadSearch = () => {
  const { filter, setFilter } = useLaunchpadPoolListSearchFilterStore();

  const statusOptions = userViewLaunchpadPoolStatuses.map((status) => ({
    label: launchpadPoolStatusLabels[status],
    value: status,
  }));

  return (
    <GlowContainer
      variant="launchpad"
      className="flex flex-col gap-3 p-3 md:p-6 1440px:flex-row"
    >
      <SearchTextDebouncedInput
        variant="launchpad"
        inputProps={{
          placeholder: "Search",
        }}
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
      />
      <NetworkMultipleSelect
        variant="launchpad"
        selected={filter.network}
        onChange={(value) => setFilter({ network: value })}
        otherProps={{
          classNames: {
            btn: "1440px:max-w-100",
          },
        }}
      />
      <MultipleSelect
        variant="launchpad"
        options={statusOptions}
        selected={filter.status as string[]}
        onChange={(value) =>
          setFilter({ status: value as LaunchpadPoolStatus[] })
        }
        showIconsInTriggerIfAny={false}
        placeholder="Status"
        placeholderMultiple="Status"
        classNames={{
          btn: "w-full 1440px:max-w-50",
          content: "font-inter",
        }}
      />
      <SortSelect
        options={[
          {
            label: "Latest",
            value: "timestamp",
            shortLabel: "Latest",
          },
          "timeEnd",
        ]}
        sortBy={filter.sortBy ?? "none"}
        sortOrder={filter.sortOrder}
        setSortBy={(sortBy) => setFilter({ sortBy })}
        setSortOrder={(sortOrder) => setFilter({ sortOrder })}
        variant="launchpad"
        classNames={{
          content: "font-inter",
          btn: "w-full 1440px:w-max 1440px:max-w-79",
        }}
      />
      <LayoutPicker
        layout={filter.listLayout}
        setLayout={(layout) => setFilter({ listLayout: layout })}
        variant="launchpad"
        hasContainer
        classNames={{
          container: "max-1440px:w-full",
          btn: "max-1440px:flex-1",
        }}
      />
    </GlowContainer>
  );
};

export default LaunchpadSearch;
