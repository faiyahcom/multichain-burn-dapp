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
import CopyableText from "@/components/common/copyable-text";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { activityKind, type PoolDetailResponse } from "@/types/pool";
import { truncateString } from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { formatTimestamp } from "./transaction-history";
import { useState } from "react";
import CustomPagination from "@/components/common/glow/glow-pagination";
import GlowContainer from "@/components/common/glow/container";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

const ActivitiesHistory = ({ poolDetail }: Props) => {
    const [page, setPage] = useState(1);
    const excludeKinds = [20].join(",");
    const { data: poolActivities, isLoading } = useQuery({
        queryKey: poolQueryKeys.activities(
            poolDetail?.pool.address || "",
            page,
            excludeKinds,
        ),
        queryFn: () =>
            poolService.getPoolActivities(
                page,
                DEFAULT_PAGE_SIZE,
                poolDetail?.pool.address || "",
                excludeKinds,
            ),
        enabled: !!poolDetail?.pool.address,
        refetchInterval: 2_500, // Poll every 2.5s to update activities
    });

    const activities = poolActivities?.activities ?? [];

    return (
        <div className="space-y-9.5">
            <GlowContainer
                variant="swap"
                className="w-full space-y-4 px-3 py-4 font-inter md:space-y-6 md:px-5 md:py-6"
            >
                <Table className="py-6 sm:border-spacing-y-5">
                    <TableHeader>
                        <TableRow>
                            {["Time", "Actor", "Description"].map((col) => (
                                <TableHead
                                    key={col}
                                    variant="swap"
                                    className="font-orbitron text-sm md:text-base lg:text-xl 2xl:text-28px"
                                >
                                    {col}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableSkeleton colCount={3} rowCount={3} isLoading={isLoading} />
                        <TableNoData colSpan={3} data={activities} isLoading={isLoading} />
                        {activities.map((activity) => (
                            <TableRow key={activity.id} variant="swap" className="text-xs md:text-sm lg:text-base 2xl:text-xl">
                                <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                                <TableCell>
                                    <CopyableText
                                        content={activity.actor}
                                        displayText={
                                            truncateString({
                                                str: activity.actor,
                                                left: 4,
                                                right: 4,
                                            }) || "—"
                                        }
                                        classNames={{
                                            container: "justify-center",
                                            displayText: "text-primary-foreground text-xs md:text-sm lg:text-base 2xl:text-xl",
                                        }}
                                    />
                                </TableCell>
                                <TableCell>{activityKind[activity.kind]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </GlowContainer>
            <CustomPagination
                currentPage={page}
                totalCount={poolActivities?.total || 0}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={(page) => setPage(page)}
                variant="swap"
            />
        </div>
    );
};

export default ActivitiesHistory;
