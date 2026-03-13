import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import MetricNumber from "@/components/common/metric-number";
import CustomPagination from "@/components/common/pagination";
import TableSpinner from "@/components/common/table-spinner";
import TokenDisplay from "@/components/common/token-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import { userQueryKeys } from "@/services/queries/queryKey";
import {
  userService,
  type GetParticipatedPoolsByUserParams,
} from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import type { SortOrder } from "@/types/common";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { SortOption, UserPoolSortBy } from "./menu";
import UserPoolsMenu from "./menu";

const ALL_NETWORK_IDS = NETWORK_CONFIGS.map((n) => n.id);
const LIMIT = 20;
const columns = [
  "Pool",
  "Burn Token",
  "Reward Token",
  "Amount Burned",
  "Claimable Reward",
  "Action",
];

const SORT_OPTIONS: SortOption[] = [
  {
    value: "claimableReward",
    label: "Claimable Reward",
    shortLabel: "Claimable",
  },
  { value: "amountBurned", label: "Amount Burned", shortLabel: "Burned" },
  { value: "joinedTime", label: "Newest Joined", shortLabel: "Newest" },
];

function UserClaimablePool() {
  const user = useAuthStore((s) => s.user);
  const [selectedNetworks, setSelectedNetworks] =
    useState<string[]>(ALL_NETWORK_IDS);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState<UserPoolSortBy | undefined>(
    "claimableReward",
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const queryParams: GetParticipatedPoolsByUserParams = {
    page,
    limit: LIMIT,
    kind: "0",
    includeStatuses: "ended",
    chainIds: convertArrayToStringParam({
      array: selectedNetworks.map(networkIdToChainId),
    }),
    search: searchText || undefined,
    sortBy: sortBy as GetParticipatedPoolsByUserParams["sortBy"],
    sortDirection: sortOrder,
  };

  const { data, isPending } = useQuery({
    queryKey: userQueryKeys.participatedPools(queryParams),
    queryFn: () => userService.getParticipatedPoolsByUser(queryParams),
    enabled: !!user?.address,
  });

  return (
    <div>
      <UserPoolsMenu
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
        sortOptions={SORT_OPTIONS}
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
                    <MetricNumber
                      number={sciToFormatted(
                        item.amountBurned,
                        item.tokenInDecimals,
                      )}
                      unit={item.tokenInSymbolCustom ?? item.tokenInSymbol}
                      isShorten
                    />
                  </TableCell>
                  <TableCell>
                    <MetricNumber
                      number={sciToFormatted(
                        item.claimableReward,
                        item.tokenOutDecimals,
                      )}
                      unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                      isShorten
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/burn/detail/$address"
                      params={{ address: item.address }}
                    >
                      <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="C"
                        textVariant="text-container-center"
                        hasGroupHover
                        text="Claim"
                        classNames={{ btn: "min-w-28 mx-auto" }}
                      />
                    </Link>
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

export default UserClaimablePool;
