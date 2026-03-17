import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import InfoTooltip from "@/components/common/info-tooltip";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import RatioDisplay from "@/components/common/ratio-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import TokenDisplay from "@/components/common/token-display";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chainIdToNetworkConfig } from "@/config/networks";
import { poolQueryKeys } from "@/services/queries/queryKey";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type PoolItemType,
  type PoolType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import SwapDialog from "@/views/swap-pool/swap-action/swap-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

interface Props {
  poolType: PoolType;
  data?: PoolItemType[];
  isLoading?: boolean;
}

const PoolListTable: React.FC<Props> = ({ poolType, data, isLoading }) => {
  const navigate = useNavigate();
  const isBurnPool = poolType === 0;
  const queryClient = useQueryClient();
  const [swapPoolAddress, setSwapPoolAddress] = useState<string | undefined>();

  const columns = [
    {
      name: "Pool",
    },
    {
      name: isBurnPool ? "Time" : "Ratio",
    },
    ...(isBurnPool
      ? [
          {
            name: "Burn",
          },
          {
            name: "Reward",
          },
        ]
      : []),
    {
      name: "Network",
    },
    {
      name: isBurnPool ? "TVL" : "TVL/Budget",
      tip: isBurnPool ? (
        <InfoTooltip content="The total amount of reward token deposited by maker when create Burn Pool" />
      ) : (
        <></>
      ),
    },
    ...(isBurnPool
      ? [
          {
            name: "Ratio",
          },
          {
            name: "Status",
          },
        ]
      : [
          {
            name: "Join",
          },
        ]),
  ];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className="space-x-1">
                <span>{column.name}</span>
                {column.tip}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner colSpan={columns.length} isLoading={isLoading} />
          <TableNoData
            colSpan={columns.length}
            data={data}
            isLoading={isLoading}
          />
          {data?.map((pool) => {
            const timeStart = formatTimestampSecondsToDate({
              timestamp: pool.timeStart,
              notFound: "",
            });
            const timeEnd = formatTimestampSecondsToDate({
              timestamp: pool.timeEnd,
              notFound: "",
            });

            const network = chainIdToNetworkConfig(pool.chainId);

            const tokenOutDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: pool.tokenOut,
              tokenSymbol: pool.tokenOutSymbol,
              tokenName: pool.tokenOutSymbol,
              customName: pool.tokenOutSymbolCustom ?? undefined,
              customSymbol: pool.tokenOutSymbolCustom ?? undefined,
              imageUri: pool.tokenOutImageUri ?? undefined,
            });

            const tokenInDisplay = resolvePoolTokenDisplay({
              network,
              tokenAddress: pool.tokenIn,
              tokenSymbol: pool.tokenInSymbol,
              tokenName: pool.tokenInSymbol,
              customName: pool.tokenInSymbolCustom ?? undefined,
              customSymbol: pool.tokenInSymbolCustom ?? undefined,
              imageUri: pool.tokenInImageUri ?? undefined,
            });

            const href = `/${isBurnPool ? "burn" : "swap"}/detail/${pool.address}`;

            return (
              <TableRow
                key={pool.address}
                onClick={() => {
                  navigate({
                    to: href,
                  });
                }}
                className="cursor-pointer"
                title={href}
              >
                {/* Pool */}
                <TableCell className="pl-7.25 text-left">
                  <p className="max-w-full truncate" title={pool.name}>
                    {pool.name}
                  </p>
                  <CopyableText
                    content={pool.address}
                    displayText={truncateString({
                      str: pool.address,
                    })}
                    classNames={{
                      container: "justify-start",
                    }}
                  />
                </TableCell>
                <TableCell>
                  {isBurnPool ? (
                    timeStart &&
                    timeEnd && (
                      // Time
                      <div className="flex flex-col items-center justify-center gap-0.5 2xl:flex-row">
                        <span>{timeStart}</span>
                        <span className="hidden 2xl:block">-</span>
                        <span>{timeEnd}</span>
                      </div>
                    )
                  ) : (
                    // Ratio
                    <RatioDisplay
                      inValue={pool.rewardDenominator}
                      outValue={pool.rewardNumerator}
                      inSymbol={pool.tokenInSymbolCustom ?? pool.tokenInSymbol}
                      outSymbol={
                        pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol
                      }
                    />
                  )}
                </TableCell>
                {/* Burn + Reward */}
                {isBurnPool && (
                  <>
                    <TableCell>
                      <TokenDisplay
                        symbol={tokenInDisplay.symbol}
                        imageUri={tokenInDisplay.imageUri}
                        className="size-4.25"
                      />
                    </TableCell>
                    <TableCell>
                      <TokenDisplay
                        symbol={tokenOutDisplay.symbol}
                        imageUri={tokenOutDisplay.imageUri}
                        className="size-4.25"
                      />
                    </TableCell>
                  </>
                )}
                {/* Network */}
                <TableCell>
                  <NetworkDisplay chainId={pool.chainId} />
                </TableCell>
                {/* TVL */}
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(
                      pool.tvl ?? 0,
                      pool.tokenOutDecimals,
                    )}
                    unit={pool.tokenOutSymbolCustom ?? pool.tokenOutSymbol}
                    isShorten
                  />
                </TableCell>
                {isBurnPool ? (
                  // Burn Status
                  <>
                    <TableCell>
                      {/* TODO: might need to change later */}
                      Dynamic
                    </TableCell>
                    <TableCell>
                      <AnimateIconButton
                        variant="letter-icon"
                        iconLetter={getPoolStatusLabel(pool.status).slice(0, 1)}
                        textVariant="text-container-center"
                        hasGroupHover
                        color={getPoolStatusColor(pool.status)}
                        text={getPoolStatusLabel(pool.status)}
                        classNames={{
                          btn: "min-w-33 mx-auto",
                        }}
                      />
                    </TableCell>
                  </>
                ) : (
                  // Swap Action
                  <TableCell>
                    <div className="mx-auto block max-w-max">
                      <PoolChainGuard chainId={pool.chainId}>
                        <AnimateIconButton
                          variant="letter-icon"
                          textVariant="text-container-center"
                          iconLetter="P"
                          hasGroupHover
                          color="#6E37FF"
                          text="Swap"
                          classNames={{
                            btn: "after:text-primary-foreground min-w-20.5",
                          }}
                          btnProps={{
                            onClick: (e) => {
                              e.stopPropagation();
                              setSwapPoolAddress(pool.address);
                            },
                          }}
                        />
                      </PoolChainGuard>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <SwapDialog
        open={!!swapPoolAddress}
        onOpenChange={(open) => {
          if (!open) setSwapPoolAddress(undefined);
        }}
        poolAddress={swapPoolAddress}
        onSuccess={() => {
          setSwapPoolAddress(undefined);
          queryClient.invalidateQueries({
            queryKey: poolQueryKeys.list(),
            exact: false,
          });
        }}
      />
    </>
  );
};

export default PoolListTable;
