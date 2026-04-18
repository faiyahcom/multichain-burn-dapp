import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import LetterIcon from "@/components/common/letter-icon";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import RatioDisplay from "@/components/common/ratio-display";
import TableSpinner from "@/components/common/table-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import { poolService } from "@/services/poolService";
import { poolQueryKeys, userQueryKeys } from "@/services/queries/queryKey";
import {
  userService,
  type GetParticipatedPoolsByUserParams,
  type ParticipatedUserPool,
} from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  swapPoolStatusColors,
  swapPoolStatusLabels,
  type PoolListRequest,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortOrder } from "@/types/common";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { SortOption, UserPoolSortBy } from "./menu";
import UserPoolsMenu from "./menu";

const SWAP_POOL_STATUSES = ["on_going", "ended", "canceled", "closed"] as const;
export type SwapPoolParticipatedStatus = (typeof SWAP_POOL_STATUSES)[number];

const statusOptions = SWAP_POOL_STATUSES.map((s) => ({
  label: swapPoolStatusLabels[s as SwapPoolStatus],
  value: s,
  icon: ({ className }: { className?: string }) => (
    <LetterIcon
      letter={s.slice(0, 1).toUpperCase()}
      color={swapPoolStatusColors[s as SwapPoolStatus]}
      className={className}
    />
  ),
}));

const ALL_NETWORK_IDS = NETWORK_CONFIGS.map((n) => n.id);
const LIMIT = 20;
const columns = ["Pool", "Ratio", "Network", "TVL", "Status"];

const PARTICIPATED_SORT_OPTIONS: SortOption[] = [
  { value: "tvl", label: "TVL", shortLabel: "TVL" },
  { value: "joinedTime", label: "Newest Joined", shortLabel: "Newest" },
];

const OWNER_SORT_OPTIONS: SortOption[] = [
  { value: "tvl", label: "TVL", shortLabel: "TVL" },
  { value: "timestamp", label: "Created At", shortLabel: "Created" },
];

interface Props {
  mode?: "participated" | "owner";
  title?: string;
}

function UserSwapPools({ mode = "participated", title }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    ...SWAP_POOL_STATUSES,
  ]);
  const [selectedNetworks, setSelectedNetworks] =
    useState<string[]>(ALL_NETWORK_IDS);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<UserPoolSortBy | undefined>("tvl");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const participatedQueryParams: GetParticipatedPoolsByUserParams = {
    page,
    limit: LIMIT,
    kinds: "1",
    includeStatuses: convertArrayToStringParam({ array: selectedStatuses }),
    chainIds: convertArrayToStringParam({
      array: selectedNetworks.map(networkIdToChainId),
    }),
    search: searchText || undefined,
    sortBy: sortBy as GetParticipatedPoolsByUserParams["sortBy"],
    sortDirection: sortOrder,
  };

  const ownerQueryParams: PoolListRequest = {
    page,
    limit: LIMIT,
    kind: "1",
    includeStatuses: convertArrayToStringParam({ array: selectedStatuses }),
    chainIds: convertArrayToStringParam({
      array: selectedNetworks.map(networkIdToChainId),
    }),
    search: searchText || undefined,
    sortBy: sortBy as PoolListRequest["sortBy"],
    sortDirection: sortOrder,
    owner: user?.address,
  };

  const isOwner = mode === "owner";
  const sortOptions = isOwner ? OWNER_SORT_OPTIONS : PARTICIPATED_SORT_OPTIONS;

  const { data: participatedData, isPending: isParticipatedPending } = useQuery(
    {
      queryKey: userQueryKeys.participatedPools(participatedQueryParams),
      queryFn: () =>
        userService.getParticipatedPoolsByUser(participatedQueryParams),
      enabled: !isOwner && !!user?.address,
    },
  );

  const { data: ownerData, isPending: isOwnerPending } = useQuery({
    queryKey: poolQueryKeys.list(ownerQueryParams),
    queryFn: () => poolService.getPoolList(ownerQueryParams),
    enabled: isOwner && !!user?.address,
  });

  const data = isOwner ? ownerData : participatedData;
  const isPending = isOwner ? isOwnerPending : isParticipatedPending;

  return (
    <div>
      <UserPoolsMenu
        title={title}
        statusOptions={statusOptions}
        selectedStatuses={selectedStatuses}
        onStatusChange={(v) => {
          setSelectedStatuses(v);
          setPage(1);
        }}
        selectedNetworks={selectedNetworks}
        onNetworkChange={(v) => {
          setSelectedNetworks(v);
          setPage(1);
        }}
        searchText={searchText}
        onSearchChange={(v) => {
          setSearchText(v);
          setPage(1);
        }}
        sortOptions={sortOptions}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner isLoading={isPending} colSpan={columns.length} />
          {!isPending &&
            data?.pools?.map((item) => {
              const participated = item as ParticipatedUserPool;
              const href = `/swap/detail/${item.address}`;

              return (
                <TableRow
                  key={item.address}
                  onClick={() => {
                    navigate({
                      to: href,
                    });
                  }}
                  className="cursor-pointer"
                  title={href}
                >
                  <TableCell className="pl-11.25 text-left">
                    <p className="max-w-full truncate" title={item.name}>
                      {item.name}
                    </p>
                    <CopyableText
                      content={item.address}
                      displayText={truncateString({ str: item.address })}
                      classNames={{ container: "justify-start" }}
                    />
                  </TableCell>
                  <TableCell>
                    <RatioDisplay
                      inValue={participated.rewardDenominator}
                      outValue={participated.rewardNumerator}
                      inSymbol={item.tokenInSymbolCustom ?? item.tokenInSymbol}
                      outSymbol={
                        item.tokenOutSymbolCustom ?? item.tokenOutSymbol
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <NetworkDisplay chainId={item.chainId} />
                  </TableCell>
                  <TableCell>
                    <MetricNumber
                      number={sciToFormatted(item.tvl, item.tokenOutDecimals)}
                      unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                      isShorten
                    />
                  </TableCell>
                  <TableCell>
                    <AnimateIconButton
                      variant="letter-icon"
                      iconLetter={getPoolStatusLabel(item.status).slice(0, 1)}
                      textVariant="text-container-center"
                      hasGroupHover
                      color={getPoolStatusColor(item.status)}
                      text={getPoolStatusLabel(item.status)}
                      classNames={{ btn: "min-w-33 mx-auto" }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      <CustomPagination
        currentPage={page}
        totalCount={data?.total ?? 0}
        pageSize={LIMIT}
        onPageChange={setPage}
      />
    </div>
  );
}

export default UserSwapPools;
