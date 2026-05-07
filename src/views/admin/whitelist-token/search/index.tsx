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
import { adminPoolTypeShortenOptions } from "@/types/admin/master-pool-management";
import { useQuery } from "@tanstack/react-query";
import { NumericInput } from "@/components/ui/numeric-input";
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
    <div className="space-y-4 px-4 pt-4 md:pt-12.75 md:pr-13.5 md:pl-21">
      {/* Header + summary + add button  */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Whitelist Token Management</h1>
          <div className="flex items-center gap-2.75 text-base font-semibold">
            <p className="text-mb-danger"> {totalTokens} {totalTokens > 1 ? "tokens" : "token"}</p>
            <p className="text-mb-green">{totalEnable} active</p>
          </div>
        </div>
        <AdminWhitelistTokenDialogCreate />
      </div>

      {/* Filters row */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          {/* Decimal range filter */}
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-xs font-medium text-foreground">
              Decimal:
            </span>
            <NumericInput
              placeholder="Min"
              value={filter.decimalMin}
              onChange={(val) => setFilter({ decimalMin: val })}
              decimalScale={0}
              className="h-[34px] w-16 rounded-md-plus border-none bg-inactive px-2.5 text-xs font-normal text-foreground shadow-none placeholder:text-foreground/50 outline-none"
            />
            <span className="text-xs font-medium text-foreground">to</span>
            <NumericInput
              placeholder="Max"
              value={filter.decimalMax}
              onChange={(val) => setFilter({ decimalMax: val })}
              decimalScale={0}
              className="h-[34px] w-16 rounded-md-plus border-none bg-inactive px-2.5 text-xs font-normal text-foreground shadow-none placeholder:text-foreground/50 outline-none"
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
            options={adminPoolTypeShortenOptions}
            placeholder="All types"
            placeholderMultiple="All types"
            selected={filter.types}
            onChange={(value) => setFilter({ types: value })}
            showIconsInTriggerIfAny={false}
            showSelectedCount
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
            className="min-w-75"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminWhitelistTokenSearch;
