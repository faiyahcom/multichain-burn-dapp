import GlowContainer from "@/components/common/glow/container";
import LayoutPicker from "@/components/common/glow/layout-picker";
import type { MultipleSelectOption } from "@/components/common/glow/multiple-select";
import MultipleSelect from "@/components/common/glow/multiple-select";
import RadioGroupButton from "@/components/common/glow/radio-group-btn";
import SearchTextDebouncedInput from "@/components/common/glow/search-text-debounced-input";
import SortSelect from "@/components/common/glow/sort-select";
import NetworkDisplay from "@/components/common/network-display";
import TokenImage from "@/components/common/token-image";
import { Skeleton } from "@/components/ui/skeleton";
import { chainIdToNetworkConfig } from "@/config/networks";
import { Route } from "@/routes/pair-detail/$chainId/$tokenIn/$tokenOut";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { usePairDetailSearchFilterStore } from "@/stores/pair-detail/search-filter-store";
import {
  burnPoolStatusLabels,
  poolTypes,
  poolTypeShortenOptions,
  swapPoolStatusLabels,
  userViewBurnPoolStatuses,
  userViewSwapPoolStatuses,
  type BurnPoolStatus,
  type PoolType,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useQuery } from "@tanstack/react-query";

const PairDetailGlowSearch = () => {
  const { filter, setFilter } = usePairDetailSearchFilterStore();
  const { chainId, tokenIn, tokenOut } = Route.useParams();
  const isBurnPool = filter.type === poolTypes[0];

  const { data: pairDetail, isPending: isPairDetailPending } = useQuery({
    queryKey: pairQueryKeys.detail({
      chainId,
      tokenIn,
      tokenOut,
    }),
    queryFn: async () => {
      return pairService.getPairDetail({
        chainId,
        tokenIn,
        tokenOut,
      });
    },
  });

  const statusOptions: MultipleSelectOption[] = !isBurnPool
    ? userViewSwapPoolStatuses.map((status) => ({
        label: swapPoolStatusLabels[status],
        value: status,
      }))
    : userViewBurnPoolStatuses.map((status) => ({
        label: burnPoolStatusLabels[status],
        value: status,
      }));

  const handleSelectType = (value: PoolType) => {
    // swap pool only show ongoing
    // switching from burn pool to swap pool will fill out all statuses
    if (value === poolTypes[1]) {
      setFilter({ type: value, status: [...userViewSwapPoolStatuses] });
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

  const network = chainId ? chainIdToNetworkConfig(chainId) : undefined;

  const tokenOutDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: tokenOut,
    tokenSymbol: pairDetail?.pair.tokenOutSymbol,
    tokenName: pairDetail?.pair.tokenOutSymbol,
    customName: pairDetail?.pair.tokenOutSymbolCustom ?? undefined,
    customSymbol: pairDetail?.pair.tokenOutSymbolCustom ?? undefined,
    imageUri: pairDetail?.pair.tokenOutImageUri ?? undefined,
  });

  const tokenInDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: tokenIn,
    tokenSymbol: pairDetail?.pair.tokenInSymbol,
    tokenName: pairDetail?.pair.tokenInSymbol,
    customName: pairDetail?.pair.tokenInSymbolCustom ?? undefined,
    customSymbol: pairDetail?.pair.tokenInSymbolCustom ?? undefined,
    imageUri: pairDetail?.pair.tokenInImageUri ?? undefined,
  });

  const pairName = `${tokenOutDisplay.symbol} / ${tokenInDisplay.symbol}`;

  return (
    <>
      <div className="w-full space-y-3 xl:space-y-6">
        <div className="flex w-full items-center gap-2.75">
          <div className="shrink-0 space-y-3 xl:space-y-6">
            <div className="relative flex items-center gap-0.5 py-1.5 pr-1.5">
              <TokenImage
                isLoading={isPairDetailPending}
                src={tokenOutDisplay.imageUri}
                alt={tokenOutDisplay.symbol}
                classNames={{
                  common: "size-7 sm:size-9.75",
                }}
              />
              <TokenImage
                isLoading={isPairDetailPending}
                src={tokenInDisplay.imageUri}
                alt={tokenInDisplay.symbol}
                classNames={{
                  common: "size-7 sm:size-9.75",
                }}
              />
              <NetworkDisplay
                chainId={chainId}
                classNames={{
                  container: "absolute right-0 bottom-0",
                  img: "size-4.75 sm:size-4.75 mr-0",
                  label: "sr-only",
                }}
                styles={{
                  img: {
                    boxShadow: "-1px -1px 0px 0px #00000040",
                  },
                }}
              />
            </div>
          </div>
          {isPairDetailPending ? (
            <Skeleton className="h-10 w-45" />
          ) : (
            <h1
              className="min-w-0 truncate text-2xl font-semibold sm:text-3xl"
              title={pairName}
            >
              {pairName}
            </h1>
          )}
        </div>

        <RadioGroupButton
          options={poolTypeShortenOptions}
          selected={filter.type?.toString()}
          onChange={(value) => handleSelectType(Number(value) as PoolType)}
          variant="pair"
        />
      </div>
      <GlowContainer
        variant="pair"
        className="flex flex-col gap-3 p-3 md:p-6 xl:flex-row"
      >
        <SearchTextDebouncedInput
          inputProps={{
            placeholder: "Search",
          }}
          value={filter.text}
          onValueChange={(value) => setFilter({ text: value })}
          variant="pair"
        />
        {isBurnPool && (
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
            placeholderMultiple="All Statuses"
            classNames={{
              btn: "xl:max-w-70",
            }}
            variant="pair"
          />
        )}
        <SortSelect
          options={["volume"]}
          sortBy={filter.sortBy ?? "none"}
          sortOrder={filter.sortOrder}
          setSortBy={(sortBy) => setFilter({ sortBy })}
          setSortOrder={(sortOrder) => setFilter({ sortOrder })}
          defaultSortBy="volume"
          variant="pair"
        />
        <LayoutPicker
          layout={filter.listLayout}
          setLayout={(layout) => setFilter({ listLayout: layout })}
          variant="pair"
          hasContainer
          classNames={{
            container: "max-xl:w-full",
            btn: "max-xl:flex-1",
          }}
        />
      </GlowContainer>
    </>
  );
};

export default PairDetailGlowSearch;
