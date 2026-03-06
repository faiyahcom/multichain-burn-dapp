import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
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
import { useQuery } from "@tanstack/react-query";

const AdminMasterPoolManagementTable = () => {
  const { filter, setFilter } = useMasterPoolManagementSearchFilterStore();
  const limit = 20;

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
        kind: !isNaN(Number(filter.type)) ? filter.type : undefined,
        search: filter.text || undefined,
      });
    },
  });

  const columns = ["Pool", "Pool Type", "Creator", "Time", "Network", "Status"];

  return (
    <div className="space-y-10 pb-10 pl-14">
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

          {pools?.pools?.map((item, index) => {
            return (
              <TableRow key={index}>
                <TableCell className="pl-11.25 text-left">
                  {/* TODO: add link format /admin/burn/detail/<adddress> */}
                  <p className="max-w-full truncate" title={item.name}>
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
                <TableCell>{/* Creator */}</TableCell>
                <TableCell>{/* Start Time - End Time */}</TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
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
