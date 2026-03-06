import RadioGroupButton from "@/components/common/radio-group-btn";
import TokenImage from "@/components/common/token-image";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  burnPoolStatuses,
  poolTypes,
  poolTypeShortenOptions,
  swapPoolStatuses,
  type PoolType,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";

const PairDetailDetailHeader = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();

  const handleSelectType = (value: PoolType) => {
    // swap pool has fewer statuses than burn pool
    // filter out statuses that don't exist in the selected pool type
    if (value === poolTypes[1]) {
      const newStatuses =
        filter.status?.filter((status) =>
          swapPoolStatuses.includes(status as SwapPoolStatus),
        ) ?? [];
      setFilter({ type: value, status: newStatuses });
      return;
    }

    // if switching from swap pool to burn pool or all types
    // and all swap statuses were selected, expand to all burn pool statuses
    if (value === poolTypes[0]) {
      if (filter.status?.length === swapPoolStatuses.length) {
        setFilter({ type: value, status: [...burnPoolStatuses] });
        return;
      }
    }

    setFilter({ type: value });
  };

  return (
    <div className="flex items-center gap-16">
      <div className="flex items-center gap-2.75">
        <div className="flex items-center gap-0.5">
          <TokenImage />
          <TokenImage />
        </div>
        <h1 className="text-3xl font-semibold">ETH / USDT</h1>
      </div>
      <RadioGroupButton
        options={poolTypeShortenOptions}
        selected={filter.type?.toString()}
        onChange={(value) => handleSelectType(Number(value) as PoolType)}
        classNames={{
          btn: "min-w-34",
        }}
      />
    </div>
  );
};

export default PairDetailDetailHeader;
