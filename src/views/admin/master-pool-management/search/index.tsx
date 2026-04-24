import LetterIcon from "@/components/common/letter-icon";
import MultipleSelect, {
  type MultipleSelectOption,
} from "@/components/common/multiple-select";
import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import SingleSelect from "@/components/common/single-select";
import { Button } from "@/components/ui/button";
import { authService, isSuperAdminRole } from "@/services/authService";
import { authQueryKeys } from "@/services/queries/queryKey";
import { useMasterPoolManagementSearchFilterStore } from "@/stores/admin/master-pool-management/search-filter-store";
import { useAuthStore } from "@/stores/authStore";
import {
  burnPoolStatuses,
  getPoolStatusColor,
  getPoolStatusLabel,
  poolTypeOptions,
  stakePoolStatuses,
  swapPoolStatuses,
  type AllPoolStatus,
  type BurnPoolStatus,
  type PoolTypeOptionValue,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useMemo } from "react";

const AdminMasterPoolManagementSearch = () => {
  const navigate = useNavigate();
  const { filter, setFilter } = useMasterPoolManagementSearchFilterStore();
  const { user } = useAuthStore();

  const { data: userApiData } = useQuery({
    queryKey: authQueryKeys.me({
      address: user?.address,
    }),
    queryFn: async () => {
      return authService.getCurrentUser();
    },
    enabled: !!user?.address,
  });
  const isSuperAdmin = isSuperAdminRole(userApiData);

  const poolTypeOptionToPoolStatues = (
    poolType: PoolTypeOptionValue,
  ): AllPoolStatus[] => {
    switch (poolType) {
      case "all":
      case "partner":
      case "0": // burn pool
        return [...burnPoolStatuses];
      case "1": // swap pool
        return [...swapPoolStatuses];
      case "2": // stake pool
        return [...stakePoolStatuses];
      case "3": // launchpad
        return [...burnPoolStatuses]; // TODO: subject to change

      default:
        return [];
    }
  };

  const statusOptions: MultipleSelectOption[] = useMemo(() => {
    const filterType = filter.type as PoolTypeOptionValue | undefined;
    if (!filterType) return [];
    const statuses = poolTypeOptionToPoolStatues(filterType);
    return statuses.map((status) => ({
      label: getPoolStatusLabel(status),
      value: status,
      icon: ({ className }: { className?: string }) => (
        <LetterIcon
          letter={status.slice(0, 1).toUpperCase()}
          color={getPoolStatusColor(status)}
          className={className}
        />
      ),
    }));
  }, [filter.type]);

  const handleSelectType = (value: PoolTypeOptionValue) => {
    const currentPoolType = filter.type;
    if (currentPoolType === value) return; // do nothing if the same

    const statuses = poolTypeOptionToPoolStatues(value);
    setFilter({ type: value, status: statuses });
  };

  return (
    <div className="space-y-9.5 px-4 pt-4 md:pt-12.75 md:pr-12.75 md:pl-21">
      <div className="flex flex-col justify-between md:flex-row">
        <h1 className="text-3xl font-semibold">Master Pool Management</h1>
        {/* Only super admin can create pool */}
        {user && isSuperAdmin && (
          <Button
            variant={"mb-primary"}
            size={"mb-square-btn"}
            onClick={() => {
              navigate({
                to: "/admin/stake/create",
              });
            }}
          >
            <span className="">Create Staking Pool</span>{" "}
            <PlusIcon className="size-3.75" />
          </Button>
        )}
      </div>
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
