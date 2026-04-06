import NetworkMultipleSelect from "@/components/common/network-multiple-select";
import SearchTextDebouncedInput from "@/components/common/search-text-debounced-input";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { whitelistService } from "@/services/whitelistService";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import {
  tokenStatus,
  tokenStatusLabels,
  type TokenStatus,
} from "@/types/admin/whitelist-token";
import { useQuery } from "@tanstack/react-query";
import AdminWhitelistTokenDialogCreate from "../dialog/create";
import AdminWhitelistTokenSearchStatusPicker from "./status-picker";
import { networkIdToChainId } from "@/config/networks";

const AdminWhitelistTokenSearch = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const limit = 20;
  const statusOptions = tokenStatus.map((status) => ({
    label: tokenStatusLabels[status],
    value: status,
  }));

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
        isDropped: "false", // only show tokens that are not soft-deleted
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
            <p className="text-mb-danger">{totalTokens} tokens</p>
            <p className="text-mb-green">{totalEnable} active</p>
          </div>
        </div>
        <AdminWhitelistTokenDialogCreate />
      </div>

      {/* status + network + text */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <AdminWhitelistTokenSearchStatusPicker
          options={statusOptions}
          counts={[totalTokens, totalEnable, totalDisable]}
          selected={filter.status}
          onChange={(status) => {
            if (status === undefined) return;
            setFilter({ status: status as TokenStatus });
          }}
        />
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
            className="md:max-w-80.75"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminWhitelistTokenSearch;
