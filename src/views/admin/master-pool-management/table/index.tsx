import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { useMasterPoolManagementSearchFilterStore } from "@/stores/admin/master-pool-management/search-filter-store";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  poolTypeLabels,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { truncateString } from "@/utils/helpers/string";
import PartnerBurnSwitch from "@/views/admin/master-pool-management/partner-burn-switch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

const AdminMasterPoolManagementTable = () => {
  const { filter, setFilter } = useMasterPoolManagementSearchFilterStore();
  const queryClient = useQueryClient();
  const limit = 20;
  const navigate = useNavigate();

  const { data: pools, isPending: isPendingPools } = useQuery({
    queryKey: poolQueryKeys.list(filter),
    queryFn: async () => {
      return poolService.getPoolList({
        page: filter.page,
        limit: limit,
        excludeStatuses: "draft", // admin does not want to see draft pools
        includeStatuses: convertArrayToStringParam({ array: filter.status }),
        chainIds: convertArrayToStringParam({
          array: filter.network?.map((network) => networkIdToChainId(network)),
        }),
        kind:
          filter.type === "partner"
            ? "0"
            : filter.type && !isNaN(Number(filter.type))
              ? filter.type
              : undefined,
        isPartner: filter.type === "partner" ? "true" : undefined,
        search: filter.text || undefined,
      });
    },
  });

  const columns = [
    "Pool",
    "Pool Type",
    "Creator",
    "Time",
    "Network",
    "Partner Burn",
    "Status",
  ];
  return (
    <div className="space-y-10 pb-10 md:pl-14">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner isLoading={isPendingPools} colSpan={columns.length} />
          <TableNoData
            colSpan={columns.length}
            data={pools?.pools}
            isLoading={isPendingPools}
          />
          {pools?.pools?.map((item) => {
            const isBurnPool = item.kind === 0;

            return (
              <TableRow
                key={item.address}
                className="cursor-pointer"
                onClick={() => {
                  navigate({
                    to: isBurnPool
                      ? "/admin/burn/detail/$address"
                      : "/admin/swap/detail/$address",
                    params: { address: item.address },
                  });
                }}
              >
                <TableCell className="pl-11.25 text-left">
                  <p className="block max-w-full truncate" title={item.name}>
                    {item.name}
                  </p>
                  <CopyableText
                    content={item.address}
                    displayText={truncateString({
                      str: item.address,
                    })}
                    classNames={{
                      container: "justify-start",
                    }}
                  />
                </TableCell>
                <TableCell>
                  {poolTypeLabels[Number(item.kind) as PoolType]}
                </TableCell>
                <TableCell>
                  <CopyableText
                    content={item.owner}
                    displayText={truncateString({
                      str: item.owner,
                    })}
                  />
                </TableCell>
                <TableCell>
                  {isBurnPool && (
                    <StartEndDateDisplay
                      startDate={item.timeStart}
                      endDate={item.timeEnd}
                      classNames={{
                        container: "2xl:flex-row",
                        dash: "2xl:block",
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
                </TableCell>
                <TableCell className="text-center">
                  {isBurnPool && (
                    <PartnerBurnSwitch
                      address={item.address}
                      isPartner={item.isPartner}
                      onSuccess={() =>
                        queryClient.invalidateQueries({
                          queryKey: poolQueryKeys.list(filter),
                        })
                      }
                      classNames={{ btn: "mx-auto" }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <AnimateIconButton
                    variant="letter-icon"
                    iconLetter={getPoolStatusLabel(item.status).slice(0, 1)}
                    textVariant="text-container-center"
                    hasGroupHover
                    color={getPoolStatusColor(item.status)}
                    text={getPoolStatusLabel(item.status)}
                    classNames={{
                      btn: "min-w-33 mx-auto",
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <CustomPagination
        currentPage={filter.page}
        totalCount={pools?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
};

export default AdminMasterPoolManagementTable;
