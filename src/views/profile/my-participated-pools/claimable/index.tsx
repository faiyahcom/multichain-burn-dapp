import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/glow/table";
import TableNoData from "@/components/common/glow/table-no-data";
import TableSkeleton from "@/components/common/glow/table-skeleton";
import TokenOutInInterceptDisplay from "@/components/common/glow/token-out-in-intercept-display";
import MetricNumber from "@/components/common/metric-number";
import { chainIdToNetworkConfig, networkIdToChainId } from "@/config/networks";
import { userQueryKeys } from "@/services/queries/queryKey";
import {
  userService,
  type GetParticipatedPoolsByUserParams,
} from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMyParticipatedPoolsClaimableSearchFilterStore } from "@/stores/my-participated-pools/claimable";
import type { PoolType } from "@/types/admin/master-pool-management";
import { PoolKindCodeEnum } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMediaQuery } from "usehooks-ts";

const ProfileMyParticipatedPoolsClaimable = () => {
  const { filter, setFilter } =
    useMyParticipatedPoolsClaimableSearchFilterStore();
  const { user } = useAuthStore();
  const limit = 10;
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const navigate = useNavigate();

  const columns = [
    "Pool",
    "Pair",
    "Amount Burned",
    "Claimable Reward",
    "Ratio",
    "Action",
  ];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;

  const queryParams: GetParticipatedPoolsByUserParams = {
    page: filter?.page ?? 1,
    limit: limit,
    kind: PoolKindCodeEnum.Burn.toString(),
    includeStatuses: undefined,
    chainIds: convertArrayToStringParam({
      array: filter?.network?.map(networkIdToChainId)?.filter(Boolean) ?? [],
    }),
    search: filter?.text || undefined,
    sortBy: filter?.sortBy,
    sortDirection: filter?.sortOrder,
    onlyUnClaimed: "true",
  };

  const { data: claimablePoolsData, isPending: isLoading } = useQuery({
    queryKey: userQueryKeys.participatedPools(queryParams),
    queryFn: () => userService.getParticipatedPoolsByUser(queryParams),
    enabled: !!user?.address,
  });

  return (
    <GlowContainer
      variant="pair"
      className="space-y-5 px-5.75 py-3 sm:space-y-10 sm:px-11.5 sm:py-6"
    >
      <Table className="sm:text-2xl">
        <TableHeader className="sm:text-2xl">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column}
                variant="pair"
                style={{
                  width: cellWidth,
                }}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSkeleton
            colCount={columns.length}
            rowCount={limit}
            isLoading={isLoading}
          />
          <TableNoData
            colSpan={columns.length}
            data={claimablePoolsData?.pools}
            isLoading={isLoading}
          />

          {claimablePoolsData?.pools?.map((pool) => {
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

            let href = "#";
            const poolType = pool.kind as PoolType;

            switch (poolType) {
              case PoolKindCodeEnum.Burn:
                href = `/burn/detail/${pool.address}`;
                break;
              case PoolKindCodeEnum.Swap:
                href = `/swap/detail/${pool.address}`;
                break;
              default:
                void (poolType satisfies never); // exhaustive check
                break;
            }

            return (
              <TableRow
                key={pool.address}
                className={"cursor-pointer"}
                onClick={() => {
                  navigate({
                    to: href,
                  });
                }}
                variant="pair"
              >
                <TableCell className="min-w-0 space-y-1 text-left">
                  <p className="min-w-0 truncate" title={pool.name}>
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
                  <TokenOutInInterceptDisplay
                    tokenOutProps={{
                      src: tokenOutDisplay.imageUri,
                      alt: tokenOutDisplay.symbol,
                      classNames: {
                        common: "sm:size-7 z-0",
                      },
                    }}
                    tokenInProps={{
                      src: tokenInDisplay.imageUri,
                      alt: tokenInDisplay.symbol,
                      classNames: {
                        common: "sm:size-7 sm:-ml-[9px] z-10",
                      },
                    }}
                    className="justify-center"
                  />
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(
                      pool.amountBurned,
                      pool.tokenInDecimals,
                    )}
                    unit={tokenInDisplay.symbol}
                    isShorten
                  />
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(
                      pool.claimableReward,
                      pool.tokenOutDecimals,
                    )}
                    unit={tokenOutDisplay.symbol}
                    isShorten
                  />
                </TableCell>
                <TableCell>
                  <p>Dynamic</p>
                </TableCell>
                <TableCell>
                  <Button
                    variant={"pair"}
                    hasGroupHover
                    className="min-w-full font-orbitron"
                  >
                    Claim
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <CustomPagination
        currentPage={filter?.page ?? 1}
        onPageChange={(page) => setFilter?.({ page })}
        pageSize={limit}
        totalCount={claimablePoolsData?.total ?? 0}
        variant="pair"
        onlyShowCurrentPage={!isDesktop}
      />
    </GlowContainer>
  );
};

export default ProfileMyParticipatedPoolsClaimable;
