import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import RangeDatePicker from "@/components/common/range-date-picker";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SingleSelect from "@/components/common/single-select";
import WhitelistTokenMultipleSelect from "@/components/common/whitelist-token-multiple-select";
import { Button } from "@/components/ui/button";
import {
  burnPoolTypeLabels,
  burnPoolTypes,
  initialMasterPoolManagementBurnSearchFilter,
  useMasterPoolManagementBurnSearchFilterStore,
  type BurnPoolType,
} from "@/stores/admin/master-pool-management/burn/search-filter-store";
import {
  burnPoolStatuses,
  getPoolStatusColor,
  getPoolStatusLabel,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";

const AdminMasterPoolManagementBurnSearch = () => {
  const { filter, setFilter } = useMasterPoolManagementBurnSearchFilterStore();

  return (
    <div className="flex flex-col gap-1 lg:flex-row lg:gap-2">
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
            options={burnPoolTypes.map((type) => ({
              label: burnPoolTypeLabels[type],
              value: type,
            }))}
            selected={filter.type}
            onChange={(value) => setFilter({ type: value as BurnPoolType })}
          />
          <WhitelistTokenMultipleSelect
            poolType={0}
            value={filter.tokens}
            onChange={(value) => setFilter({ tokens: value })}
          />
          <MultipleSelect
            options={burnPoolStatuses.map((status) => ({
              label: getPoolStatusLabel(status),
              value: status.toString(),
              icon: ({ className }) => (
                <LetterIcon
                  letter={getPoolStatusLabel(status)[0]}
                  color={getPoolStatusColor(status)}
                  className={className}
                />
              ),
            }))}
            selected={filter.status}
            onChange={(value) =>
              setFilter({ status: value as BurnPoolStatus[] })
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
              setFilter(initialMasterPoolManagementBurnSearchFilter);
            }}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterPoolManagementBurnSearch;
