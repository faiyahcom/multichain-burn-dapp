import { useState } from "react";
import CustomPagination from "@/components/common/pagination";
import LetterIcon from "@/components/common/letter-icon";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NETWORK_CONFIGS } from "@/config/networks";
import type { SortBy, SortOrder } from "@/types/common";
import {
    burnPoolStatusColors,
    burnPoolStatusLabels,
    type BurnPoolStatus,
} from "@/types/admin/master-pool-management";
import MyParticipatedMenu from "./menu";
import { BURN_CLAIMABLE_STATUSES } from "./burn-pool";

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

const columns = ["Pool", "Time", "Burn", "Reward", "Network", "TVL", "Claimable", "Status"];

function MyParticipatedClaimable() {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...BURN_CLAIMABLE_STATUSES]);
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

export default MyParticipatedClaimable