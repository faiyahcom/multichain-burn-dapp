import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import MultipleSelect from "@/components/common/multiple-select";
import SingleSelect from "@/components/common/single-select";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { whitelistService } from "@/services/whitelistService";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import {
  tokenStatusLabels,
  type TokenStatus,
} from "@/types/admin/whitelist-token";
import { poolTypeShortenOptions } from "@/types/admin/master-pool-management";
import { useQuery } from "@tanstack/react-query";
import AdminWhitelistTokenDialogCreate from "../dialog/create";
import { networkIdToChainId } from "@/config/networks";

const statusSelectOptions = [
  { label: "All statuses", value: "all", triggerLabel: "All statuses" },
  { label: tokenStatusLabels["enable"], value: "enable" },
  { label: tokenStatusLabels["disable"], value: "disable" },
];

const AdminWhitelistTokenSearch = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const limit = 20;

  const { data: listTokensData } = useQuery({
    queryKey: whitelistQueryKeys.listTokens(filter),
    queryFn: () =>
      whitelistService.getListTokens({
        page: filter.page,
        limit: limit,
        chainIds:
          filter.network.length > 0
            ? filter.network
                .map((network) => networkIdToChainId(network))
                .filter((chainId) => chainId)
                .join(",")
            : undefined,
        active: filter.status === "all" ? undefined : filter.status,
        search: filter.text ? filter.text : undefined,
        kinds: filter.types.length > 0 ? filter.types.join(",") : undefined,
        minDecimals: filter.decimalMin ? Number(filter.decimalMin) : undefined,
        maxDecimals: filter.decimalMax ? Number(filter.decimalMax) : undefined,
        isDropped: "false",
      }),
  });

  const totalEnable = listTokensData?.totalEnable ?? 0;
  const totalDisable = listTokensData?.totalDisable ?? 0;
  const totalTokens = totalEnable + totalDisable;

  return (
    <div className="space-y-4 pt-12.75 pr-13.5 pl-21">
      {/* Header + summary + add button */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Whitelist Token Management</h1>
          <div className="flex items-center gap-2.75 text-base font-semibold">
            <p className="text-mb-danger">{totalTokens} tokens</p>
            <p className="text-mb-green">{totalEnable} active</p>
          </div>
        </div>
        <AdminWhitelistTokenDialogCreate />
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Decimal range filter */}
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-xs font-medium text-foreground">
              Decimal:
            </span>
            <input
              type="number"
              placeholder="Min"
              value={filter.decimalMin}
              onChange={(e) => setFilter({ decimalMin: e.target.value })}
              className="h-[34px] w-16 rounded-md-plus bg-inactive px-2.5 text-xs font-normal text-foreground placeholder:text-foreground/50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs font-medium text-foreground">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filter.decimalMax}
              onChange={(e) => setFilter({ decimalMax: e.target.value })}
              className="h-[34px] w-16 rounded-md-plus bg-inactive px-2.5 text-xs font-normal text-foreground placeholder:text-foreground/50 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Status single-select (like pool type in Master Pool Management) */}
          <SingleSelect
            options={statusSelectOptions}
            selected={filter.status}
            onChange={(value) => setFilter({ status: value as TokenStatus })}
            classNames={{
              content: "w-44",
              btn: "min-w-34",
            }}
          />

          {/* Types multi-select with "N selected" display */}
          <MultipleSelect
            options={poolTypeShortenOptions}
            placeholder="All types"
            placeholderMultiple="All types"
            selected={filter.types}
            onChange={(value) => setFilter({ types: value })}
            showIconsInTriggerIfAny={false}
            showSelectedCount
          />
        </div>

        <div className="flex items-center gap-3">
          <NetworkMultipleSelect
            selected={filter.network}
            onChange={(value) => setFilter({ network: value })}
          />
          <SearchTextDebouncedInput
            inputProps={{
              placeholder: "Search by name, symbol, or address",
            }}
            value={filter.text}
            onValueChange={(value) => setFilter({ text: value })}
            className="sm:max-w-80.75"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminWhitelistTokenSearch;
