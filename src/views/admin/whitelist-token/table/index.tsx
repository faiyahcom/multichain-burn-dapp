import {
  IconEye,
  IconFileDoc,
  IconSquareArrowTopRightOut,
  IconTrashCan,
} from "@/assets/react";
import AnimateIconButton from "@/components/common/animate-icon-button";
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
import {
  whitelistService,
  type DeleteWhitelistTokenRequest,
  type WhitelistToken,
} from "@/services/whitelistService";
import { useAdminWhitelistTokenSearchFilterStore } from "@/stores/admin/whitelist-token/search-filter-store";
import {
  booleanToTokenStatus,
  tokenStatusColors,
  tokenStatusLabels,
  tokenStatusLetters,
} from "@/types/admin/whitelist-token";
import { truncateString } from "@/utils/helpers/string";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StatusSwitch from "./status-switch";
import AdminWhitelistTokenDialogDetail from "../dialog/detail";
import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useAppKitAccount } from "@reown/appkit/react";
import { useDisableWhitelistTokenSolanaFn } from "./useDisableWhitelistTokenSolanaFn";
import { useDisableWhitelistTokenEvmFn } from "./useDisableWhitelistTokenEvmFn";
import ConfirmDialog from "@/components/common/confirm-dialog";

type DeleteWhitelistTokenRequestWithStatus = DeleteWhitelistTokenRequest & {
  enabled: boolean;
};

const AdminWhitelistTokenTable = () => {
  const { filter, setFilter } = useAdminWhitelistTokenSearchFilterStore();
  const [detailToken, setDetailToken] = useState<WhitelistToken | undefined>(
    undefined,
  );
  const [isScDeleting, setIsScDeleting] = useState<boolean>(false);
  const [deleteRequest, setDeleteRequest] = useState<
    DeleteWhitelistTokenRequestWithStatus | undefined
  >(undefined);
  const { caipAddress } = useAppKitAccount();
  const namespace = caipAddress?.split(":")[0];
  const isSolana = namespace === "solana";
  const isEvm = namespace === "eip155";

  const { disableWhitelistToken: disableWhitelistTokenSolana } =
    useDisableWhitelistTokenSolanaFn();
  const { disableWhitelistToken: disableWhitelistTokenEvm } =
    useDisableWhitelistTokenEvmFn();

  const queryClient = useQueryClient();
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

  const { mutate: deleteTokenMutation, isPending: isDeleteTokenPending } =
    useMutation({
      mutationFn: async (request: DeleteWhitelistTokenRequest) => {
        return await whitelistService.deleteWhitelistToken(request);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: whitelistQueryKeys.summary(),
        });
        queryClient.invalidateQueries({
          queryKey: whitelistQueryKeys.listTokens(),
          exact: false,
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
    setDeleteRequest(request);
  };

  const handleDeleteTokenConfirm = async (
    request: DeleteWhitelistTokenRequestWithStatus,
  ) => {
    // Disable before deleting
    if (request.enabled) {
      setIsScDeleting(true);
      if (isSolana) {
        await disableWhitelistTokenSolana({
          tokenAddress: request.address,
        });
      }
      if (isEvm) {
        await disableWhitelistTokenEvm({
          tokenAddress: request.address,
        });
      }
      setIsScDeleting(false);
    }

    deleteTokenMutation(request);
  };

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
                        <div className="h-8 w-8 shrink-0 rounded-full border border-active bg-inactive" />
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
                    <StatusSwitch
                      switchProps={{
                        active: item.enable,
                        classNames: {
                          btn: "mx-auto",
                        },
                      }}
                      chainId={item.chainId}
                      address={item.address}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-4.5">
                      <button onClick={() => setDetailToken(item)}>
                        <IconEye className="[&>path]:group-hover:stroke-[1.5px]" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteToken({
                            chainId: item.chainId,
                            address: item.address,
                            enabled: item.enable,
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

        <CustomPagination
          currentPage={filter.page}
          totalCount={listTokensData?.total || 0}
          pageSize={limit}
          onPageChange={(page) => setFilter({ page })}
        />
      </div>

      <AdminWhitelistTokenDialogDetail
        data={detailToken}
        setData={setDetailToken}
      />

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
