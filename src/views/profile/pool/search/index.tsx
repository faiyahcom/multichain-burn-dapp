import GlowContainer from "@/components/common/glow/container";
import type { MultipleSelectOption } from "@/components/common/glow/multiple-select";
import MultipleSelect from "@/components/common/glow/multiple-select";
import NetworkMultipleSelect from "@/components/common/glow/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect, {
  type SortByOption,
} from "@/components/common/glow/sort-select";
import { cn } from "@/lib/utils";
import type { ProfilePoolSearchType } from "@/stores/common/profile-pool";
import {
  burnPoolStatuses,
  getPoolStatusLabel,
  poolTypeLabels,
  swapPoolStatuses,
  type AllPoolStatus,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { useMemo } from "react";

interface Props {
  filter?: ProfilePoolSearchType;
  setFilter?: (filter: Partial<ProfilePoolSearchType>) => void;
  poolType: PoolType | "claimable";
  profileType: "my-participated-pools" | "my-create-pools";
}

const ProfilePoolSearch: React.FC<Props> = ({
  filter,
  setFilter,
  poolType,
  profileType,
}) => {
  const statusOptions = useMemo<MultipleSelectOption[]>(() => {
    let statuses: AllPoolStatus[] = [];

    switch (poolType) {
      case PoolKindCodeEnum.Burn:
        if (profileType === "my-create-pools")
          statuses = ["draft", ...burnPoolStatuses];
        if (profileType === "my-participated-pools")
          statuses = [...swapPoolStatuses]; // For participated pools, user cannot join "pending", "holding" and "upcoming" status, so basically it is the same as swap pool
        break;
      case PoolKindCodeEnum.Swap:
        if (profileType === "my-create-pools")
          statuses = ["draft", ...swapPoolStatuses];
        if (profileType === "my-participated-pools")
          statuses = [...swapPoolStatuses];
        break;
      case PoolKindCodeEnum.Stake:
        if (profileType === "my-create-pools") statuses = []; // user cannot create stake pool
        if (profileType === "my-participated-pools")
          statuses = [...swapPoolStatuses]; // For participated pools, user cannot join "holding" and "upcoming" status, so basically it is the same as swap pool
        break;
      case PoolKindCodeEnum.Launchpad:
        statuses = []; // TODO: implement launchpad pool search
        break;
      case "claimable":
        statuses = [];
        break;
      default:
        void (poolType satisfies never); // exhaustive check
        statuses = [];
        break;
    }

    return statuses.map((status) => ({
      label: getPoolStatusLabel(status as AllPoolStatus),
      value: status,
    }));
  }, [poolType, profileType]);

  const sortOptions = useMemo<SortByOption[]>(() => {
    if (poolType === "claimable")
      return [
        "claimableReward",
        {
          value: "amountBurned",
          label: "Amount Deposited",
          shortLabel: "Deposited",
        },
        {
          value: "timestamp",
          label: "Newest Joined",
          shortLabel: "Newest",
        },
      ];

    if (poolType === PoolKindCodeEnum.Stake) return ["stakedAmount", "apr"];

    return ["volume", "liquidity"];
  }, [poolType]);

  const poolTypeOptions: MultipleSelectOption[] = [
    PoolKindCodeEnum.Burn,
    PoolKindCodeEnum.Stake,
  ].map((type) => ({
    label: poolTypeLabels[type],
    value: type.toString(),
  }));

  return (
    <GlowContainer
      variant="pair"
      className="flex flex-col items-center gap-3 p-3 sm:gap-6 sm:p-6 2xl:flex-row"
    >
      <SearchTextDebouncedInput
        variant="pair"
        inputProps={{
          placeholder: "Search",
        }}
        value={filter?.text}
        onValueChange={(value) => setFilter?.({ text: value })}
      />
      {poolType !== "claimable" && (
        <MultipleSelect
          variant="pair"
          options={statusOptions}
          onChange={(value) =>
            setFilter?.({ status: value as AllPoolStatus[] })
          }
          selected={filter?.status}
          placeholder="Status"
          placeholderMultiple="All Statuses"
          classNames={{
            btn: "w-full 2xl:max-w-65",
          }}
        />
      )}
      <NetworkMultipleSelect
        variant="pair"
        selected={filter?.network}
        onChange={(value) => setFilter?.({ network: value })}
        otherProps={{
          classNames: {
            btn: "w-full 2xl:max-w-100",
          },
        }}
      />
      {poolType === "claimable" && (
        <MultipleSelect
          variant="pair"
          options={poolTypeOptions}
          onChange={(value) =>
            setFilter?.({ poolType: value?.map((v) => Number(v)) })
          }
          selected={filter?.poolType?.map((v) => v.toString())}
          placeholder="Type"
          classNames={{
            btn: "w-full 2xl:max-w-65",
          }}
        />
      )}
      <SortSelect
        options={sortOptions}
        sortBy={filter?.sortBy ?? "none"}
        sortOrder={filter?.sortOrder}
        setSortBy={(sortBy) => setFilter?.({ sortBy })}
        setSortOrder={(sortOrder) => setFilter?.({ sortOrder })}
        variant="pair"
        classNames={{
          container: cn("w-full 2xl:max-w-65", {
            "2xl:w-79": poolType === PoolKindCodeEnum.Stake,
          }),
          btn: cn("w-full", {
            "2xl:min-w-79": poolType === PoolKindCodeEnum.Stake,
          }),
          content: cn({
            "sm:w-76": poolType === "claimable",
          }),
        }}
      />
    </GlowContainer>
  );
};

export default ProfilePoolSearch;
