import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { activityKind, type PoolDetailResponse } from "@/types/pool";
import { formatAmount } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";
import { formatTimestamp } from "./transaction-history";
import { trimAddress } from "../pool-overview";
import CustomPagination from "@/components/common/pagination";
import { useState } from "react";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const DEFAULT_PAGE_SIZE = 5;

const ActivitiesHistory = ({ poolDetail }: Props) => {
  const [page, setPage] = useState(1);
  const { data: poolActivities, isLoading } = useQuery({
    queryKey: poolQueryKeys.activities(poolDetail?.pool.address || "", page),
    queryFn: () =>
      poolService.getPoolActivities(
        page,
        DEFAULT_PAGE_SIZE,
        poolDetail?.pool.address || "",
      ),
    enabled: !!poolDetail?.pool.address,
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
      <Table className="mb-2 border-spacing-y-0 rounded-b-lg border border-progress-bg">
        <TableHeader>
          <TableRow>
            <TableHead className="h-auto w-40 border-b border-progress-bg py-3 text-base font-medium">
              Time
            </TableHead>
            <TableHead className="h-auto w-40 border-b border-progress-bg py-3 text-base font-medium">
              Actor
            </TableHead>
            <TableHead className="h-auto w-auto border-b border-progress-bg py-3 pr-20 text-right text-base font-medium">
              Description
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-progress-bg">
          {activities.map((activity) => (
            <TableRow key={activity.id} className="text-base text-greyed">
              <TableCell className="w-40">
                {formatTimestamp(activity.timestamp)}
              </TableCell>
              <TableCell className="w-40">
                {trimAddress(activity.actor, 4) || "—"}
              </TableCell>
              <TableCell className="w-auto pr-20 text-right">
                {activityKind[activity.kind]}
              </TableCell>
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
};

export default ActivitiesHistory;
