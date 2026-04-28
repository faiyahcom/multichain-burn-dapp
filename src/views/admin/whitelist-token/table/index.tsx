import {
  IconEye,
  IconFileDoc,
  IconSquareArrowTopRightOut,
  IconTrashCan,
} from "@/assets/react";
import { PencilIcon } from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
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
import { networkIdToChainId, chainIdToNetworkConfig } from "@/config/networks";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { useSystemStore } from "@/stores/systemStore";
import { whitelistQueryKeys } from "@/services/queries/queryKey";
import {
  whitelistService,
  type DeleteWhitelistTokenRequest,
  type WhitelistToken,
} from "@/services/whitelistService";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import { poolTypeLabels } from "@/types/admin/master-pool-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { truncateString } from "@/utils/helpers/string";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/components/common/custom-toast";
import AdminWhitelistTokenDialogDetail from "../dialog/detail";
import AdminWhitelistTokenDialogEdit from "../dialog/edit";
import StatusSwitch from "./status-switch";
import { useDisableWhitelistTokenEvmFn } from "./useDisableWhitelistTokenEvmFn";
import { useDisableWhitelistTokenSolanaFn } from "./useDisableWhitelistTokenSolanaFn";
import TokenImage from "@/components/common/token-image";
import TableNoData from "@/components/common/table-no-data";
import type { PoolType } from "@/types/admin/master-pool-management";

type DeleteWhitelistTokenRequestWithStatus = DeleteWhitelistTokenRequest & {
  enabled: boolean;
  poolTypes: PoolType[];
};

const AdminWhitelistTokenTable = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const [detailToken, setDetailToken] = useState<WhitelistToken | undefined>(
    undefined,
  );
  const [editToken, setEditToken] = useState<WhitelistToken | undefined>(
    undefined,
  );
  const [isScDeleting, setIsScDeleting] = useState<boolean>(false);
  const [deleteRequest, setDeleteRequest] = useState<
    DeleteWhitelistTokenRequestWithStatus | undefined
  >(undefined);
  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";
  const currentNetworkId = namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;

  const { disableWhitelistToken: disableWhitelistTokenSolana } =
    useDisableWhitelistTokenSolanaFn();
  const { disableWhitelistToken: disableWhitelistTokenEvm } =
    useDisableWhitelistTokenEvmFn();

  const queryClient = useQueryClient();
  const limit = 20;

  const { data: listTokensData, isPending: isListTokensPending } = useQuery({
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
        isDropped: "false", // only show tokens that are not soft-deleted
      }),
  });



  const { mutate: deleteTokenMutation, isPending: isDeleteTokenPending } =
    useMutation({
      mutationFn: async (request: DeleteWhitelistTokenRequest) => {
        return await whitelistService.deleteWhitelistToken(request);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: whitelistQueryKeys.listTokens().filter(Boolean),
        });
        toast.success("Token deleted successfully!");
      },
      onError: (error) => {
        const message = getErrorMessage({ error });
        toast.error(message);
      },
      onSettled: () => {
        setDeleteRequest(undefined);
      },
    });

  const handleDeleteToken = (
    request: DeleteWhitelistTokenRequestWithStatus,
  ) => {
    if (request.enabled) {
      const tokenNetworkId = chainIdToNetworkConfig(request.chainId)?.id;

      if (tokenNetworkId && currentNetworkId !== tokenNetworkId) {
        openSwitchNetworkModal(currentNetworkId, tokenNetworkId);
        return;
      }
    }
    setDeleteRequest(request);
  };

  const handleDeleteTokenConfirm = async (
    request: DeleteWhitelistTokenRequestWithStatus,
  ) => {
    // Disable before deleting
    let isDisabled = false;
    if (request.enabled) {
      setIsScDeleting(true);

      if (isSolana) {
        isDisabled = await disableWhitelistTokenSolana({
          tokenAddress: request.address,
          poolTypes: request.poolTypes,
        });
      }

      if (isEvm) {
        isDisabled = await disableWhitelistTokenEvm({
          tokenAddress: request.address,
          poolTypes: request.poolTypes,
        });
      }

      setIsScDeleting(false);
    } else {
      isDisabled = true; // already disabled then return true
    }

    // Only delete if it is disabled
    if (isDisabled) {
      deleteTokenMutation(request);
    }
  };

  const columns = [
    "Token",
    "Address",
    "Network",
    "Decimal",
    "Pool",
    "Description",
    "Links",
    "Status",
    "Action",
  ];


  const isTokenDeleting = isScDeleting || isDeleteTokenPending;

  return (
    <>
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
            <TableSpinner
              isLoading={isListTokensPending}
              colSpan={columns.length}
            />
            <TableNoData
              colSpan={columns.length}
              data={listTokensData?.whitelistTokens}
              isLoading={isListTokensPending}
            />
            {listTokensData?.whitelistTokens?.map((item, index) => {
              const activePoolTypes =
                (item.kind?.filter((k) => k.enable).map((k) => k.kind) as PoolType[]) ??
                [];
              const availablePoolTypes =
                (item.kind?.map((k) => k.kind) as PoolType[]) ?? [];
              const displayKinds =
                item.kind?.length
                  ? activePoolTypes.length > 0
                    ? item.kind.filter((kObj) => kObj.enable)
                    : item.kind
                  : [];
              const isItemEnabled =
                item.kind?.length > 0 ? activePoolTypes.length > 0 : item.enable;

              return (
                <TableRow key={index} className="group">
                  <TableCell>
                    <div className="flex items-center gap-1.75 pl-[15%]">
                      <TokenImage
                        src={item.imageUri}
                        alt={item.customName || item.name || "N/A"}
                      />
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
                    {item.decimals}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {displayKinds.map((kObj) => (
                        <span
                          key={kObj.kind}
                          className="text-xs font-medium transition-all group-hover:font-bold"
                        >
                          {poolTypeLabels[kObj.kind as keyof typeof poolTypeLabels] ?? `Kind ${kObj.kind}`}
                        </span>
                      ))}
                    </div>
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
                    <div className="flex items-center justify-center gap-4">
                      {item.homepage && (
                        <a
                          href={item.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Homepage"
                          className="text-foreground transition-colors hover:text-active"
                        >
                          <IconSquareArrowTopRightOut className="size-4" />
                        </a>
                      )}
                      {item.whitepaper && (
                        <a
                          href={item.whitepaper}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Whitepaper"
                          className="text-foreground transition-colors hover:text-active"
                        >
                          <IconFileDoc className="size-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusSwitch
                      switchProps={{
                        active: isItemEnabled,
                        classNames: {
                          btn: "mx-auto",
                        },
                      }}
                      chainId={item.chainId}
                      address={item.address}
                      poolTypes={activePoolTypes}
                      availablePoolTypes={availablePoolTypes}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-4.5">
                      <button onClick={() => {
                        if (currentNetworkId) {
                          const tokenNetworkId = chainIdToNetworkConfig(item.chainId)?.id;
                          if (networkIdToChainId(currentNetworkId) == item.chainId) {
                            setEditToken(item)
                          } else if (tokenNetworkId) {
                            openSwitchNetworkModal(currentNetworkId, tokenNetworkId)
                          }
                        }
                      }}>
                        <PencilIcon className="size-4" />
                      </button>
                      <button onClick={() => setDetailToken(item)}>
                        <IconEye className="[&>path]:group-hover:stroke-[1.5px]" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteToken({
                            chainId: item.chainId,
                            address: item.address,
                            enabled: isItemEnabled,
                            poolTypes: activePoolTypes,
                          })
                        }
                      >
                        <IconTrashCan className="[&>path]:group-hover:stroke-[1.5px]" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {
          listTokensData && listTokensData?.total > 0 && (
            <CustomPagination
              currentPage={filter.page}
              totalCount={listTokensData?.total || 0}
              pageSize={limit}
              onPageChange={(page) => setFilter({ page })}
            />
          )
        }
      </div>

      <AdminWhitelistTokenDialogDetail
        data={detailToken}
        setData={setDetailToken}
      />

      {editToken && (
        <AdminWhitelistTokenDialogEdit
          token={editToken}
          open={!!editToken}
          onOpenChange={(open) => {
            if (!open) {
              setEditToken(undefined);
            }
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteRequest}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRequest(undefined);
          }
        }}
        title="Delete Whitelist Token"
        description="Are you sure you want to delete this token?"
        onCancel={() => setDeleteRequest(undefined)}
        onConfirm={() => handleDeleteTokenConfirm(deleteRequest!)}
        isLoading={isTokenDeleting}
      />
    </>
  );
};

export default AdminWhitelistTokenTable;
