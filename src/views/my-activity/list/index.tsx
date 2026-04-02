import CopyableText from "@/components/common/copyable-text";
import GlowContainer from "@/components/common/glow/container";
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
import { userQueryKeys } from "@/services/queries/queryKey";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMyActivitySearchFilterStore } from "@/stores/my-activity/search-filter-store";
import { getActivityKindLabel } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";

const MyActivityList = () => {
  const { filter, setFilter } = useMyActivitySearchFilterStore();
  const { user } = useAuthStore();
  const limit = 10;

  const columns = ["Action", "Pool", "Description", "Tx Hash", "Time"];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;

  const { data: userActivities, isPending: isPendingUserActivities } = useQuery(
    {
      queryKey: userQueryKeys.activities({
        user: user?.id,
        ...filter,
      }),
      queryFn: async () =>
        userService.getUserActivities({
          page: 1,
          limit: limit,
          search: filter.text ? filter.text : undefined,
          kinds: convertArrayToStringParam({ array: filter.activityKind }),
        }),
      enabled: !!user,
    },
  );

  return (
    <GlowContainer
      variant="pair"
      className="space-y-5 px-5.75 py-3 sm:space-y-10 sm:px-11.5 sm:py-6"
    >
      <Table className="sm:text-2xl">
        <TableHeader className="sm:text-2xl">
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column}
                className="text-center"
                variant="pair"
                style={{
                  width: cellWidth,
                }}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSkeleton
            colCount={columns.length}
            rowCount={limit}
            isLoading={isPendingUserActivities}
          />
          <TableNoData
            colSpan={columns.length}
            data={userActivities?.activities}
            isLoading={isPendingUserActivities}
          />
          {userActivities?.activities?.map((activity) => {
            const activityLabel = getActivityKindLabel(activity.kind);
            const poolName = activity.pool?.name;
            const poolAddress = activity.poolAddress;
            const hash = activity.hash;
            const date = formatTimestampSecondsToDate({
              timestamp: activity.timestamp,
              formatStr: "MMMM d, yyyy. h:mm a",
            });

            return (
              <TableRow key={activity.id}>
                <TableCell className="min-w-0 text-left">
                  <p className="min-w-0 truncate" title={activityLabel}>
                    {activityLabel}
                  </p>
                </TableCell>
                <TableCell className="min-w-0 space-y-0.5 text-left sm:space-y-1">
                  <p className="min-w-0 truncate" title={poolName}>
                    {poolName}
                  </p>
                  <CopyableText
                    content={poolAddress}
                    displayText={truncateString({
                      str: poolAddress,
                    })}
                    classNames={{
                      container: "justify-start",
                    }}
                  />
                </TableCell>
                <TableCell></TableCell>
                <TableCell>
                  <CopyableText
                    content={hash}
                    displayText={truncateString({
                      str: hash,
                    })}
                    classNames={{
                      displayText: "sm:text-2xl",
                      container: "justify-start",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <p>{date}</p>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </GlowContainer>
  );
};

export default MyActivityList;
