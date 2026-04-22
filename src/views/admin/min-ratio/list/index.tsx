import { IconTrashCan } from "@/assets/react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { toast } from "@/components/common/custom-toast";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import RatioDisplay from "@/components/common/ratio-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import TokenImage from "@/components/common/token-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chainIdToNetworkConfig, networkIdToChainId } from "@/config/networks";
import {
  pairConfigsService,
  type PairConfigDeleteRequest,
} from "@/services/pairConfigsService";
import { pairConfigsQueryKeys } from "@/services/queries/queryKey";
import { useMinRatioSearchFilterStore } from "@/stores/admin/min-ratio/search-filter-store";
import { useSystemStore } from "@/stores/systemStore";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { mapChainToSystemNetwork } from "@/utils/helpers/networks";
import { shortenNumber } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useAppKitAccount } from "@reown/appkit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

const AdminMinRatioList = () => {
  const navigate = useNavigate();
  const { filter, setFilter } = useMinRatioSearchFilterStore();
  const limit = 20;
  const columns = ["Pair", "Network", "Min Ratio", "Actions"];
  const { caipAddress } = useAppKitAccount();
  const { openSwitchNetworkModal } = useSystemStore();
  const [namespace, chainRef] = caipAddress?.split(":") ?? [];
  const currentNetworkId =
    namespace && chainRef ? mapChainToSystemNetwork(namespace, chainRef) : null;
  const [deleteRequest, setDeleteRequest] =
    useState<PairConfigDeleteRequest | null>(null);
  const queryClient = useQueryClient();

  const checknChainIdToProceed = ({
    chainId,
    handle,
  }: {
    chainId: string;
    handle?: () => void;
  }) => {
    const targetNetworkId = chainIdToNetworkConfig(chainId)?.id;
    if (!targetNetworkId) {
      toast.error("Invalid network ID.");
      return;
    }
    if (currentNetworkId) {
      const currentChainId = networkIdToChainId(currentNetworkId);
      if (currentChainId === chainId) {
        handle?.();
      } else {
        openSwitchNetworkModal(currentNetworkId, targetNetworkId);
      }
    } else {
      openSwitchNetworkModal(currentNetworkId, targetNetworkId);
    }
  };

  const { data: listPairConfigsData, isPending: isListPairConfigsPending } =
    useQuery({
      queryKey: pairConfigsQueryKeys.list(filter),
      queryFn: async () => {
        return pairConfigsService.listPairConfigs({
          page: filter.page,
          limit,
          chainId: convertArrayToStringParam({
            array: filter.network?.map((network) =>
              networkIdToChainId(network),
            ),
          }),
          search: filter.text || undefined,
          minRatio: filter.min || undefined,
          maxRatio: filter.max || undefined,
        });
      },
    });

  const {
    mutate: deletePairConfigMutate,
    isPending: isDeletePairConfigPending,
  } = useMutation({
    mutationFn: async (request: PairConfigDeleteRequest) => {
      return await pairConfigsService.deletePairConfig(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pairConfigsQueryKeys.list().filter(Boolean),
        exact: false,
      });
      toast.success("Min ratio deleted successfully!");
      setDeleteRequest(null);
    },
    onError: (error) => {
      const message = getErrorMessage({ error });
      toast.error(message);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteRequest) {
      deletePairConfigMutate(deleteRequest);
    }
  };

  return (
    <>
      <div className="space-y-10 pb-10 md:pl-14">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className="whitespace-pre-line">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSpinner
              isLoading={isListPairConfigsPending}
              colSpan={columns.length}
            />
            <TableNoData
              colSpan={columns.length}
              data={listPairConfigsData?.pairConfigs}
              isLoading={isListPairConfigsPending}
            />
            {listPairConfigsData?.pairConfigs?.map((pairConfig) => {
              const networkConfig = chainIdToNetworkConfig(
                pairConfig.chainId?.toString(),
              );

              const tokenInDisplay = resolvePoolTokenDisplay({
                network: networkConfig,
                tokenAddress: pairConfig.tokenIn,
                tokenSymbol: pairConfig.tokenInSymbol,
                tokenName: pairConfig.tokenInName,
                customName: pairConfig.tokenInCustomName ?? undefined,
                customSymbol: pairConfig.tokenInCustomSymbol ?? undefined,
                imageUri: pairConfig.tokenInImageUri ?? undefined,
              });

              const tokenOutDisplay = resolvePoolTokenDisplay({
                network: networkConfig,
                tokenAddress: pairConfig.tokenOut,
                tokenSymbol: pairConfig.tokenOutSymbol,
                tokenName: pairConfig.tokenOutName,
                customName: pairConfig.tokenOutCustomName ?? undefined,
                customSymbol: pairConfig.tokenOutCustomSymbol ?? undefined,
                imageUri: pairConfig.tokenOutImageUri ?? undefined,
              });

              return (
                <TableRow
                  key={`${pairConfig.chainId}-${pairConfig.tokenIn}-${pairConfig.tokenOut}`}
                >
                  <TableCell className="w-75 xl:w-100">
                    <div className="flex min-w-0 items-center gap-3.25 pl-15.75">
                      <div className="flex shrink-0 items-center gap-px">
                        <TokenImage
                          src={tokenOutDisplay.imageUri}
                          alt={tokenOutDisplay.symbol}
                          classNames={{
                            common: "size-6.25",
                          }}
                        />
                        <TokenImage
                          src={tokenInDisplay.imageUri}
                          alt={tokenInDisplay.symbol}
                          classNames={{
                            common: "size-6.25",
                          }}
                        />
                      </div>
                      <span
                        className="min-w-0 truncate"
                        title={`${tokenOutDisplay.symbol}/${tokenInDisplay.symbol}`}
                      >
                        {tokenOutDisplay.symbol}/{tokenInDisplay.symbol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <NetworkDisplay chainId={pairConfig.chainId?.toString()} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center justify-center gap-1 sm:flex-row">
                      <RatioDisplay
                        inSymbol={tokenInDisplay.symbol}
                        outSymbol={tokenOutDisplay.symbol}
                        inValue={pairConfig.ratioNumerator}
                        outValue={pairConfig.ratioDenominator}
                      />
                      <span className="text-secondary-foreground">
                        (
                        {shortenNumber({
                          number: Number(pairConfig.ratio),
                        })}
                        )
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-4.5">
                      <button
                        onClick={() => {
                          checknChainIdToProceed({
                            chainId: pairConfig.chainId?.toString(),
                            handle: () => {
                              navigate({
                                to: "/admin/min-ratio/edit/$chainId/$tokenIn/$tokenOut",
                                params: {
                                  chainId: pairConfig.chainId?.toString(),
                                  tokenIn: pairConfig.tokenIn,
                                  tokenOut: pairConfig.tokenOut,
                                },
                              });
                            },
                          });
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => {
                          checknChainIdToProceed({
                            chainId: pairConfig.chainId?.toString(),
                            handle: () => {
                              setDeleteRequest({
                                tokenIn: pairConfig.tokenIn,
                                tokenOut: pairConfig.tokenOut,
                              });
                            },
                          });
                        }}
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
          totalCount={listPairConfigsData?.total ?? 0}
          pageSize={limit}
          onPageChange={(page) => setFilter({ page })}
        />
      </div>

      <ConfirmDialog
        open={!!deleteRequest}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRequest(null);
          }
        }}
        title="Delete Min Ratio"
        description="Are you sure you want to delete this min ratio?"
        onCancel={() => setDeleteRequest(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeletePairConfigPending}
      />
    </>
  );
};

export default AdminMinRatioList;
