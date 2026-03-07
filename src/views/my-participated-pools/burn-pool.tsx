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
    burnPoolStatusColors,
    burnPoolStatusLabels,
    getPoolStatusColor,
    getPoolStatusLabel,
    type BurnPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortOrder } from "@/types/common";
import type { ParticipatedPoolSortBy } from "./menu";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import { formatTimestampSecondsToDate, truncateString } from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import MyParticipatedMenu from "./menu";
import type { SortOption } from "./menu";
import TokenDisplay from "@/components/common/token-display";
import { formatUnits } from "ethers";

export const BURN_CLAIMABLE_STATUSES = [
    "pending",
    "upcoming",
    "on_going",
    "holding",
    "ended",
    "canceled",
    "closed",
] as const;

export type BurnPoolParticipatedStatus = (typeof BURN_CLAIMABLE_STATUSES)[number];

const statusOptions = BURN_CLAIMABLE_STATUSES.map((s) => ({
    label: burnPoolStatusLabels[s as BurnPoolStatus],
    value: s,
    icon: ({ className }: { className?: string }) => (
        <LetterIcon
            letter={s.slice(0, 1).toUpperCase()}
            color={burnPoolStatusColors[s as BurnPoolStatus]}
            className={className}
        />
    ),
}));

const ALL_NETWORK_IDS = NETWORK_CONFIGS.map((n) => n.id);
const LIMIT = 20;
const columns = ["Pool", "Time", "Burn", "Reward", "Network", "TVL", "Ratio", "Status"];

const SORT_OPTIONS: SortOption[] = [
    { value: "tvl", label: "TVL", shortLabel: "TVL" },
    { value: "joinedTime", label: "Newest Joined", shortLabel: "Newest" },
];

function MyParticipatedBurnPools() {
    const user = useAuthStore((s) => s.user);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...BURN_CLAIMABLE_STATUSES]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>(ALL_NETWORK_IDS);
    const [searchText, setSearchText] = useState("");
    const [sortBy, setSortBy] = useState<ParticipatedPoolSortBy | undefined>("tvl");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [page, setPage] = useState(1);

    const queryParams: GetParticipatedPoolsByUserParams = {
        page,
        limit: LIMIT,
        kind: "0",
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
                        const timeStart = formatTimestampSecondsToDate({ timestamp: item.timeStart, notFound: "" });
                        const timeEnd = formatTimestampSecondsToDate({ timestamp: item.timeEnd, notFound: "" });
                        const tvl = formatUnits(item.tvl, item.tokenOutDecimals);

                        return (
                            <TableRow key={item.address}>
                                <TableCell className="pl-11.25 text-left">
                                    <Link to="/burn/detail/$address" params={{ address: item.address }} className="block max-w-full truncate" title={item.name}>
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
                                        <>{timeStart} - {timeEnd}</>
                                    )}
                                </TableCell>
                                <TableCell><TokenDisplay symbol={item.tokenInSymbol} customSymbol={item.tokenInSymbolCustom ?? undefined} imageUri={item.tokenInImageUri ?? undefined} /></TableCell>
                                <TableCell><TokenDisplay symbol={item.tokenOutSymbol} customSymbol={item.tokenOutSymbolCustom ?? undefined} imageUri={item.tokenOutImageUri ?? undefined} /></TableCell>
                                <TableCell><NetworkDisplay chainId={item.chainId} /></TableCell>
                                <TableCell>{tvl} {item.tokenOutSymbolCustom ?? item.tokenOutSymbol}</TableCell>
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

export default MyParticipatedBurnPools;
