import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import LetterIcon from "@/components/common/letter-icon";
import NetworkDisplay from "@/components/common/network-display";
import CustomPagination from "@/components/common/pagination";
import TableSpinner from "@/components/common/table-spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NETWORK_CONFIGS, networkIdToChainId } from "@/config/networks";
import { userService, type GetParticipatedPoolsByUserParams } from "@/services/userService";
import { userQueryKeys } from "@/services/queries/queryKey";
import { useAuthStore } from "@/stores/authStore";
import {
    getPoolStatusColor,
    getPoolStatusLabel,
    swapPoolStatusColors,
    swapPoolStatusLabels,
    type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortOrder } from "@/types/common";
import type { ParticipatedPoolSortBy } from "./menu";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { truncateString } from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import MyParticipatedMenu from "./menu";
import type { SortOption } from "./menu";
import { formatUnits } from "ethers";

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

const SORT_OPTIONS: SortOption[] = [
    { value: "tvl", label: "TVL", shortLabel: "TVL" },
    { value: "joinedTime", label: "Newest Joined", shortLabel: "Newest" },
];

function MyParticipatedSwapPools() {
    const user = useAuthStore((s) => s.user);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...SWAP_POOL_STATUSES]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>(ALL_NETWORK_IDS);
    const [searchText, setSearchText] = useState("");
    const [sortBy, setSortBy] = useState<ParticipatedPoolSortBy | undefined>("tvl");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [page, setPage] = useState(1);

    const queryParams: GetParticipatedPoolsByUserParams = {
        page,
        limit: LIMIT,
        kind: "1",
        includeStatuses: convertArrayToStringParam({ array: selectedStatuses }),
        chainIds: convertArrayToStringParam({
            array: selectedNetworks.map(networkIdToChainId),
        }),
        search: searchText || undefined,
        sortBy,
        sortDirection: sortOrder,
    };

    const { data, isPending } = useQuery({
        queryKey: userQueryKeys.participatedPools(queryParams),
        queryFn: () => userService.getParticipatedPoolsByUser(queryParams),
        enabled: !!user?.address,
    });

    return (
        <div>
            <MyParticipatedMenu
                statusOptions={statusOptions}
                selectedStatuses={selectedStatuses}
                onStatusChange={(v) => { setSelectedStatuses(v); setPage(1); }}
                selectedNetworks={selectedNetworks}
                onNetworkChange={(v) => { setSelectedNetworks(v); setPage(1); }}
                searchText={searchText}
                onSearchChange={(v) => { setSearchText(v); setPage(1); }}
                sortOptions={SORT_OPTIONS}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
            />
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => <TableHead key={col}>{col}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableSpinner isLoading={isPending} colSpan={columns.length} />
                    {!isPending && data?.pools?.map((item) => {
                        const tvl = formatUnits(item.tvl, item.tokenOutDecimals);

                        return (
                            <TableRow key={item.address}>
                                <TableCell className="pl-11.25 text-left">
                                    <Link to="/swap/detail/$address" params={{ address: item.address }} className="block max-w-full truncate" title={item.name}>
                                        {item.name}
                                    </Link>
                                    <CopyableText
                                        content={item.address}
                                        displayText={truncateString({ str: item.address })}
                                        classNames={{ container: "justify-start" }}
                                    />
                                </TableCell>
                                <TableCell>{item.rewardDenominator} {item.tokenInSymbolCustom ?? item.tokenInSymbol} = {item.rewardNumerator} {item.tokenOutSymbolCustom ?? item.tokenOutSymbol}</TableCell>
                                <TableCell><NetworkDisplay chainId={item.chainId} /></TableCell>
                                <TableCell>{tvl} {item.tokenOutSymbolCustom ?? item.tokenOutSymbol}</TableCell>
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

export default MyParticipatedSwapPools;
