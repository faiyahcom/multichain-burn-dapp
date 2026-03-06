import { useState } from "react";
import CustomPagination from "@/components/common/pagination";
import LetterIcon from "@/components/common/letter-icon";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NETWORK_CONFIGS } from "@/config/networks";
import type { SortBy, SortOrder } from "@/types/common";
import {
    swapPoolStatusColors,
    swapPoolStatusLabels,
    type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import MyParticipatedMenu from "./menu";

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

const columns = ["Pool", "Time", "Swap", "Network", "TVL", "Status"];

function MyParticipatedSwapPools() {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...SWAP_POOL_STATUSES]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>(ALL_NETWORK_IDS);
    const [searchText, setSearchText] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("timestamp");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    return (
        <div>
            <MyParticipatedMenu
                statusOptions={statusOptions}
                selectedStatuses={selectedStatuses}
                onStatusChange={setSelectedStatuses}
                selectedNetworks={selectedNetworks}
                onNetworkChange={setSelectedNetworks}
                searchText={searchText}
                onSearchChange={setSearchText}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
            />
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={index}>{column}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {true && (
                        <TableRow>
                            <TableCell colSpan={columns.length}>
                                <div className="flex items-center justify-center py-6">
                                    <Spinner />
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <CustomPagination
                currentPage={1}
                totalCount={100}
                pageSize={10}
                onPageChange={() => { }}
            />
        </div>
    );
}

export default MyParticipatedSwapPools;