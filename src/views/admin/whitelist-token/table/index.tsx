import {
  IconEye,
  IconFileDoc,
  IconSquareArrowTopRightOut,
  IconTrashCan,
} from "@/assets/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
import BlueSwitch from "@/components/common/blue-switch";
import CopyableText from "@/components/common/copyable-text";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { networkIdToChainId } from "@/config/networks";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import { whitelistService } from "@/services/whitelistService";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import {
  booleanToTokenStatus,
  tokenStatusColors,
  tokenStatusLabels,
  tokenStatusLetters,
} from "@/types/admin/whitelist-token";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";

const AdminWhitelistTokenTable = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const limit = 20;

  const { data: listTokensData, isPending: isListTokensPending } = useQuery({
    queryKey: [...whitelistQueryKeys.listTokens(), JSON.stringify(filter)],
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
      }),
  });

  const columns = [
    "Token",
    "Address",
    "Network",
    "Description",
    "Links",
    "Status",
    "Toggle",
    "Action",
  ];

  return (
    <div className="space-y-10 pb-10 pl-3.75">
      <Table className="table-auto">
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isListTokensPending && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div className="flex items-center justify-center py-6">
                  <Spinner />
                </div>
              </TableCell>
            </TableRow>
          )}
          {listTokensData?.whitelistTokens?.map((item, index) => {
            const status = booleanToTokenStatus(item.enable);

            return (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-1.75 pl-[15%]">
                    {item.imageUri ? (
                      <img
                        src={item.imageUri}
                        alt={item.name}
                        className="size-8 shrink-0 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-active bg-inactive" />
                    )}
                    <div className="text-left">
                      <p className="text-base">
                        {item.customName || item.name || "N/A"}
                      </p>
                      <p className="text-11px font-normal text-foreground">
                        {item.customSymbol || item.symbol || "N/A"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CopyableText
                    content={item.address}
                    displayText={truncateString({
                      str: item.address,
                    })}
                  />
                </TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
                </TableCell>
                <TableCell>
                  <p
                    className="mx-auto max-w-55.25 truncate"
                    title={item.description}
                  >
                    {item.description}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-6">
                    {item.homepage && (
                      <a
                        href={item.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconSquareArrowTopRightOut className="[&>path]:group-hover:stroke-[1.5px]" />
                      </a>
                    )}
                    {item.whitepaper && (
                      <a
                        href={item.whitepaper}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconFileDoc className="[&>path]:group-hover:stroke-[1.5px]" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <AnimateIconButton
                    iconLetter={tokenStatusLetters[status]}
                    textVariant="text-self-center"
                    text={tokenStatusLabels[status]}
                    color={tokenStatusColors[status]}
                    hasGroupHover
                    classNames={{
                      btn: "min-w-27 mx-auto",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <BlueSwitch
                    active={item.enable}
                    classNames={{
                      btn: "mx-auto",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-4.5">
                    <button>
                      <IconEye className="[&>path]:group-hover:stroke-[1.5px]" />
                    </button>
                    <button>
                      <IconTrashCan className="[&>path]:group-hover:stroke-[1.5px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <CustomPagination
        currentPage={filter.page}
        totalCount={listTokensData?.total || 0}
        pageSize={limit}
        onPageChange={(page) => setFilter({ page })}
      />
    </div>
  );
};

export default AdminWhitelistTokenTable;
