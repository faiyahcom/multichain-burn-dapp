import GlowContainer from "@/components/common/glow/container";
import type { MultipleSelectOption } from "@/components/common/glow/multiple-select";
import MultipleSelect from "@/components/common/glow/multiple-select";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import type { ProfilePoolSearchType } from "@/stores/common/profile-pool";
import {
  burnPoolStatuses,
  getPoolStatusLabel,
  swapPoolStatuses,
  type AllPoolStatus,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { useMemo } from "react";

interface Props {
  filter?: ProfilePoolSearchType;
  setFilter?: (filter: Partial<ProfilePoolSearchType>) => void;
  poolType: PoolType;
}

const ProfilePoolSearch: React.FC<Props> = ({
  filter,
  setFilter,
  poolType,
}) => {
  const statusOptions = useMemo<MultipleSelectOption[]>(() => {
    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        return ["draft", ...burnPoolStatuses].map((status) => ({
          label: getPoolStatusLabel(status as AllPoolStatus),
          value: status,
        }));
      case PoolKindCodeEnum.Swap:
        return ["draft", ...swapPoolStatuses].map((status) => ({
          label: getPoolStatusLabel(status as AllPoolStatus),
          value: status,
        }));
      default:
        void (poolType satisfies never); // exhaustive check
        return [];
    }
  }, [poolType]);

  return (
    <GlowContainer
      variant="pair"
      className="flex flex-col items-center gap-3 p-3 sm:gap-6 sm:p-6 xl:flex-row"
    >
      <SearchTextDebouncedInput
        variant="pair"
        inputProps={{
          placeholder: "Search",
        }}
        value={filter?.text}
        onValueChange={(value) => setFilter?.({ text: value })}
      />
      <MultipleSelect
        variant="pair"
        options={statusOptions}
        onChange={(value) => setFilter?.({ status: value as AllPoolStatus[] })}
        selected={filter?.status}
        placeholder="Status"
        placeholderMultiple="All Statuses"
        classNames={{
          btn: "w-full xl:max-w-65",
        }}
      />
      <NetworkMultipleSelect
        variant="pair"
        selected={filter?.network}
        onChange={(value) => setFilter?.({ network: value })}
        otherProps={{
          classNames: {
            btn: "w-full xl:max-w-100",
          },
        }}
      />
      <SortSelect
        options={["volume", "liquidity"]}
        sortBy={filter?.sortBy ?? "none"}
        sortOrder={filter?.sortOrder}
        setSortBy={(sortBy) => setFilter?.({ sortBy })}
        setSortOrder={(sortOrder) => setFilter?.({ sortOrder })}
        variant="pair"
        classNames={{
          container: "w-full xl:max-w-100",
          btn: "w-full",
        }}
      />
    </GlowContainer>
  );
};

export default ProfilePoolSearch;
