import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import LetterIcon from "@/components/common/letter-icon";
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
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import {
  userService,
  type GetParticipatedPoolsByUserParams,
} from "@/services/userService";
import { poolService } from "@/services/poolService";
import { userQueryKeys, poolQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type BurnPoolStatus,
  type PoolListRequest,
} from "@/types/admin/master-pool-management";
import type { SortOrder } from "@/types/common";
import type { UserPoolSortBy } from "./menu";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import UserPoolsMenu from "./menu";
import type { SortOption } from "./menu";
import TokenDisplay from "@/components/common/token-display";
import { sciToFormatted } from "@/utils/helpers/numbers";
import TableNoData from "@/components/common/table-no-data";
import MetricNumber from "@/components/common/metric-number";

export const BURN_CLAIMABLE_STATUSES = [
  "pending",
  "upcoming",
  "on_going",
  "holding",
  "ended",
  "canceled",
  "closed",
] as const;

const OWNER_BURN_STATUSES = ["draft", ...BURN_CLAIMABLE_STATUSES] as const;

export type BurnPoolParticipatedStatus =
  (typeof BURN_CLAIMABLE_STATUSES)[number];

const makeStatusOptions = (statuses: readonly string[]) =>
  statuses.map((s) => ({
    label: getPoolStatusLabel(s as BurnPoolStatus),
    value: s,
    icon: ({ className }: { className?: string }) => (
      <LetterIcon
        letter={s.slice(0, 1).toUpperCase()}
        color={getPoolStatusColor(s as BurnPoolStatus)}
        className={className}
      />
    ),
  }));

const participatedStatusOptions = makeStatusOptions(BURN_CLAIMABLE_STATUSES);
const ownerStatusOptions = makeStatusOptions(OWNER_BURN_STATUSES);

const ALL_NETWORK_IDS = NETWORK_CONFIGS.map((n) => n.id);
const LIMIT = 20;
const columns = [
  "Pool",
  "Time",
  "Burn",
  "Reward",
  "Network",
  "TVL",
  "Ratio",
  "Status",
];

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

function UserBurnPools({ mode = "participated", title }: Props) {
  const user = useAuthStore((s) => s.user);
  const isOwner = mode === "owner";
  const allStatuses = isOwner ? OWNER_BURN_STATUSES : BURN_CLAIMABLE_STATUSES;
  const statusOptions = isOwner
    ? ownerStatusOptions
    : participatedStatusOptions;
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    ...allStatuses,
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
    kind: "0",
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
    kind: "0",
    includeStatuses: convertArrayToStringParam({ array: selectedStatuses }),
    chainIds: convertArrayToStringParam({
      array: selectedNetworks.map(networkIdToChainId),
    }),
    search: searchText || undefined,
    sortBy: sortBy as PoolListRequest["sortBy"],
    sortDirection: sortOrder,
    owner: user?.address,
  };

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
          <TableNoData
            colSpan={columns.length}
            data={data?.pools}
            isLoading={isPending}
          />
          {!isPending &&
            data?.pools?.map((item) => {
              const timeStart = formatTimestampSecondsToDate({
                timestamp: item.timeStart,
                notFound: "",
              });
              const timeEnd = formatTimestampSecondsToDate({
                timestamp: item.timeEnd,
                notFound: "",
              });

              return (
                <TableRow key={item.address}>
                  <TableCell className="pl-11.25 text-left">
                    <Link
                      to="/burn/detail/$address"
                      params={{ address: item.address }}
                      className="block max-w-full truncate"
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                    <CopyableText
                      content={item.address}
                      displayText={truncateString({ str: item.address })}
                      classNames={{ container: "justify-start" }}
                    />
                  </TableCell>
                  <TableCell>
                    {timeStart && timeEnd && (
                      <>
                        {timeStart} - {timeEnd}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <TokenDisplay
                      symbol={item.tokenInSymbol}
                      customSymbol={item.tokenInSymbolCustom ?? undefined}
                      imageUri={item.tokenInImageUri ?? undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <TokenDisplay
                      symbol={item.tokenOutSymbol}
                      customSymbol={item.tokenOutSymbolCustom ?? undefined}
                      imageUri={item.tokenOutImageUri ?? undefined}
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
                  <TableCell>Dynamic</TableCell>
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

export default UserBurnPools;
