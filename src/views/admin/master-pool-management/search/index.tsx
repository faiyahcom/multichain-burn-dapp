import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect, {
  type MultipleSelectOption,
} from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SingleSelect from "@/components/common/single-select";
import { useMasterPoolManagementSearchFilterStore } from "@/stores/admin/master-pool-management/search-filter-store";
import {
  burnPoolStatusColors,
  burnPoolStatuses,
  burnPoolStatusLabels,
  poolTypeOptions,
  poolTypes,
  swapPoolStatusColors,
  swapPoolStatuses,
  swapPoolStatusLabels,
  type BurnPoolStatus,
  type PoolTypeOptionValue,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";

const AdminMasterPoolManagementSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementSearchFilterStore();
  const statusOptions: MultipleSelectOption[] =
    filter.type === poolTypes[1].toString()
      ? swapPoolStatuses.map((status) => ({
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
      : burnPoolStatuses.map((status) => ({
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

  const handleSelectType = (value: PoolTypeOptionValue) => {
    // swap pool has fewer statuses than burn pool
    // filter out statuses that don't exist in the selected pool type
    if (value === poolTypes[1].toString()) {
      const newStatuses =
        filter.status?.filter((status) =>
          swapPoolStatuses.includes(status as SwapPoolStatus),
        ) ?? [];
      setFilter({ type: value, status: newStatuses });
      return;
    }

    // partner burn is a subset of burn pools — treat like burn pool for statuses
    if (value === "partner") {
      if (filter.status?.length === swapPoolStatuses.length) {
        setFilter({ type: value, status: [...burnPoolStatuses] });
        return;
      }
      setFilter({ type: value });
      return;
    }

    // if switching from swap pool to burn pool or all types
    // and all swap statuses were selected, expand to all burn pool statuses
    if (value === poolTypes[0].toString() || value === "all") {
      if (filter.status?.length === swapPoolStatuses.length) {
        setFilter({ type: value, status: [...burnPoolStatuses] });
        return;
      }
    }

    setFilter({ type: value });
  };

  return (
    <div className="space-y-9.5 px-4 pt-4 md:pt-12.75 md:pr-12.75 md:pl-21">
      <h1 className="text-3xl font-semibold">Master Pool Management</h1>
      <div className="flex flex-col justify-between gap-2.5 md:flex-row md:items-center">
        <SingleSelect
          options={poolTypeOptions}
          selected={filter.type}
          onChange={handleSelectType}
          classNames={{
            content: "w-55.5 capitalize",
            btn: "min-w-34",
          }}
        />

        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
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
              btn: "md:max-w-50",
            }}
          />
          <NetworkMultipleSelect
            selected={filter.network}
            onChange={(value) => setFilter({ network: value })}
          />
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Search Pools...",
            }}
            value={filter.text}
            onValueChange={(value) => setFilter({ text: value })}
            className="md:max-w-62.5"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPoolManagementSearch;
