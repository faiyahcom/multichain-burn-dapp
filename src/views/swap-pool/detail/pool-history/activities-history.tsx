import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { poolService } from '@/services/poolService';
import { poolQueryKeys } from '@/services/queries/queryKey';
import { activityKind, type PoolDetailResponse } from '@/types/pool';
import { useQuery } from '@tanstack/react-query';
import { formatTimestamp } from './transaction-history';
import { truncateString } from '@/utils/helpers/string';
import CustomPagination from '@/components/common/pagination';
import { useState } from 'react';

type Props = {
    poolDetail?: PoolDetailResponse;
}

const DEFAULT_PAGE_SIZE = 5;

const ActivitiesHistory = ({ poolDetail }: Props) => {
    const [page, setPage] = useState(1);
    const excludeKinds = [20].join(",");
    const { data: poolActivities, isLoading } = useQuery({
        queryKey: poolQueryKeys.activities(
            poolDetail?.pool?.address || "",
            page,
            excludeKinds,
        ),
        queryFn: () =>
            poolService.getPoolActivities(
                page,
                DEFAULT_PAGE_SIZE,
                poolDetail?.pool?.address || "",
                excludeKinds,
            ),
        enabled: !!poolDetail?.pool?.address,
        refetchInterval: 2_500, // Poll every 2.5s to update activities
    });

    const activities = poolActivities?.activities ?? [];

    if (isLoading) {
        return (
            <div className="w-full py-8 text-center text-greyed">
                Loading transactions...
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="w-full py-8 text-center text-greyed">
                No activities yet
            </div>
        );
    }

    return (
        <>
            <Table className="border-spacing-y-0 mb-2 rounded-b-lg border border-progress-bg">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-40 h-auto border-b border-progress-bg py-3 text-base font-medium">
                            Time
                        </TableHead>
                        <TableHead className="w-40 h-auto border-b border-progress-bg py-3 text-base font-medium">
                            Actor
                        </TableHead>
                        <TableHead className="text-right pr-20 w-auto h-auto border-b border-progress-bg py-3 text-base font-medium">
                            Description
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
                    {activities.map((activity) => (
                        <TableRow key={activity.id} className="text-base text-greyed">
                            <TableCell className="w-40">{formatTimestamp(activity.timestamp)}</TableCell>
                            <TableCell className="w-40">{truncateString({ str: activity.actor, left: 4, right: 4 }) || '—'}</TableCell>
                            <TableCell className="text-right pr-20 w-auto">{activityKind[activity.kind]}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <CustomPagination
                currentPage={page}
                totalCount={poolActivities?.total || 0}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={(page) => setPage(page)}
            />
        </>
    );
}

export default ActivitiesHistory