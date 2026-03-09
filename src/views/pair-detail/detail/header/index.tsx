import NetworkDisplay from "@/components/common/network-display";
import RadioGroupButton from "@/components/common/radio-group-btn";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Route } from "@/routes/pair-detail/$chainId/$tokenIn/$tokenOut";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  poolTypes,
  poolTypeShortenOptions,
  userViewBurnPoolStatuses,
  userViewSwapPoolStatuses,
  type PoolType,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import { useQuery } from "@tanstack/react-query";

const PairDetailDetailHeader = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();

  const { chainId, tokenIn, tokenOut } = Route.useParams();

  const { data: pairDetailStats, isPending: isPairDetailStatsPending } =
    useQuery({
      queryKey: pairQueryKeys.stats({
        chainId,
        tokenIn,
        tokenOut,
      }),
      queryFn: async () => {
        return pairService.getPairStats({
          chainId,
          tokenIn,
          tokenOut,
        });
      },
    });

  const handleSelectType = (value: PoolType) => {
    // swap pool has fewer statuses than burn pool
    // filter out statuses that don't exist in the selected pool type
    if (value === poolTypes[1]) {
      const newStatuses =
        filter.status?.filter((status) =>
          (userViewSwapPoolStatuses as ReadonlyArray<SwapPoolStatus>).includes(
            status as SwapPoolStatus,
          ),
        ) ?? [];
      setFilter({ type: value, status: newStatuses });
      return;
    }

    // if switching from swap pool to burn pool or all types
    // and all swap statuses were selected, expand to all burn pool statuses
    if (value === poolTypes[0]) {
      if (filter.status?.length === userViewSwapPoolStatuses.length) {
        setFilter({ type: value, status: [...userViewBurnPoolStatuses] });
        return;
      }
    }

    setFilter({ type: value });
  };

  return (
    <div className="flex items-center gap-16">
      <div className="flex items-center gap-2.75">
        {/* Client wants the order to be token out / token in, refers to MB-415 */}
        <div className="relative flex items-center gap-0.5 py-1.5 pr-1.5">
          <TokenImage
            isLoading={isPairDetailStatsPending}
            src={pairDetailStats?.pair.tokenOutImageUri}
            alt={
              pairDetailStats?.pair.tokenOutSymbolCustom ??
              pairDetailStats?.pair.tokenOutSymbol
            }
          />
          <TokenImage
            isLoading={isPairDetailStatsPending}
            src={pairDetailStats?.pair.tokenInImageUri}
            alt={
              pairDetailStats?.pair.tokenInSymbolCustom ??
              pairDetailStats?.pair.tokenInSymbol
            }
          />
          <NetworkDisplay
            chainId={chainId}
            classNames={{
              container: "absolute right-0 bottom-0",
              img: "size-4.75 mr-0",
              label: "sr-only",
            }}
            styles={{
              img: {
                boxShadow: "-1px -1px 0px 0px #00000040",
              },
            }}
          />
        </div>
        {isPairDetailStatsPending ? (
          <Skeleton className="h-10 w-45" />
        ) : (
          <h1 className="text-3xl font-semibold">
            {pairDetailStats?.pair.tokenOutSymbolCustom ??
              pairDetailStats?.pair.tokenOutSymbol}
            /
            {pairDetailStats?.pair.tokenInSymbolCustom ??
              pairDetailStats?.pair.tokenInSymbol}
          </h1>
        )}
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
