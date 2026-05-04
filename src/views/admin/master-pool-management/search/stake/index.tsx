import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import RangeDatePicker from "@/components/common/range-date-picker";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SingleSelect from "@/components/common/single-select";
import WhitelistTokenMultipleSelect from "@/components/common/whitelist-token-multiple-select";
import { Button } from "@/components/ui/button";
import {
  initialMasterPoolManagementStakeSearchFilter,
  stakeNotiLabels,
  stakeNotiOptions,
  useMasterPoolManagementStakeSearchFilterStore,
  type StakeNotiOption,
} from "@/stores/admin/master-pool-management/stake/search-filter-store";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  stakePoolStatuses,
  type AllPoolStatus,
  type StakePoolStatus,
} from "@/types/admin/master-pool-management";

const AdminMasterPoolManagementStakeSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementStakeSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 md:flex-row md:gap-2">
      <SearchTextDebouncedInput
        value={filter.text}
        onValueChange={(value) => setFilter({ text: value })}
        inputProps={{
          placeholder: "Search...",
        }}
      />
      <div className="flex flex-col gap-1 lg:gap-2">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
          <SingleSelect
            options={stakeNotiOptions.map((opt) => ({
              label: stakeNotiLabels[opt],
              value: opt,
            }))}
            selected={filter.type}
            onChange={(value) => setFilter({ type: value as StakeNotiOption })}
          />
          <WhitelistTokenMultipleSelect
            poolType={2}
            value={filter.tokens}
            onChange={(value) => setFilter({ tokens: value })}
          />
          <MultipleSelect
            options={["draft", ...stakePoolStatuses].map((status) => ({
              label: getPoolStatusLabel(status as AllPoolStatus),
              value: status.toString(),
              icon: ({ className }) => (
                <LetterIcon
                  letter={getPoolStatusLabel(status as AllPoolStatus)[0]}
                  color={getPoolStatusColor(status as AllPoolStatus)}
                  className={className}
                />
              ),
            }))}
            selected={filter.status}
            onChange={(value) =>
              setFilter({ status: value as (StakePoolStatus | "draft")[] })
            }
            placeholderMultiple="All Status"
            showIconsInTriggerIfAny={false}
          />
          <NetworkMultipleSelect
            selected={filter.network}
            onChange={(value) => setFilter({ network: value })}
          />
        </div>
        <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-end lg:gap-2">
          <RangeDatePicker
            value={filter.poolStartRange}
            onChange={(value) => setFilter({ poolStartRange: value })}
            filterByText="Pool Start Time"
          />
          <RangeDatePicker
            value={filter.poolEndRange}
            onChange={(value) => setFilter({ poolEndRange: value })}
            filterByText="Pool End Time"
          />
          <RangeDatePicker
            value={filter.dateRange}
            onChange={(value) => setFilter({ dateRange: value })}
            filterByText="Date Filter"
          />
          <Button
            variant={"mb-clear-all"}
            size={"mb-btn"}
            className="lg:order-first"
            onClick={() => {
              setFilter(initialMasterPoolManagementStakeSearchFilter);
            }}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPoolManagementStakeSearch;
