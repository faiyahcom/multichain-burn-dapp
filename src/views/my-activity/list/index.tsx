import CopyableText from "@/components/common/copyable-text";
import GlowContainer from "@/components/common/glow/container";
import CustomPagination from "@/components/common/glow/glow-pagination";
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
import MetricNumber from "@/components/common/metric-number";
import { userQueryKeys } from "@/services/queries/queryKey";
import { userService, type UserActivityType } from "@/services/userService";
import { useAuthStore } from "@/stores/authStore";
import { useMyActivitySearchFilterStore } from "@/stores/my-activity/search-filter-store";
import { getActivityKindLabel, myActivityExcludes } from "@/types/pool";
import { convertArrayToStringParam } from "@/utils/helpers/array";
import {
  formatTimestampSecondsToDate,
  getPoolHref,
  truncateString,
} from "@/utils/helpers/string";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

const MyActivityList = () => {
  const { filter, setFilter } = useMyActivitySearchFilterStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const limit = 10;

  const columns = ["Action", "Pool", "Description", "Tx Hash", "Time"];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const { data: userActivities, isPending: isPendingUserActivities } = useQuery(
    {
      queryKey: userQueryKeys.activities({
        user: user?.id,
        ...filter,
      }),
      queryFn: async () =>
        userService.getUserActivities({
          page: filter.page,
          limit: limit,
          search: filter.text ? filter.text : undefined,
          kinds: convertArrayToStringParam({ array: filter.activityKind }),
          excludeKinds: myActivityExcludes,
        }),
      enabled: !!user,
    },
  );

  return (
    <GlowContainer
      variant="pair"
      className="space-y-5 px-5.75 py-3 sm:space-y-10 sm:px-11.5 sm:py-6"
    >
      {/* Change this max width if more columns are added */}
      <Table className="max-w-319.25 sm:text-2xl">
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
              formatStr: "yyyy/MM/dd. h:mm a",
            });

            const href = getPoolHref({
              address: poolAddress,
              kind: activity.poolKind,
            });

            return (
              <TableRow
                key={activity.id}
                onClick={() => {
                  navigate({
                    to: href,
                  });
                }}
                className="cursor-pointer"
                variant="pair"
              >
                <TableCell className="min-w-0 text-left">
                  <p className="min-w-0 truncate" title={activityLabel}>
                    {activityLabel}
                  </p>
                </TableCell>
                <TableCell className="min-w-0 space-y-0.5 text-left sm:space-y-1">
                  <p
                    className="max-w-38.75 min-w-0 truncate sm:max-w-69"
                    title={poolName}
                  >
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
                <TableCell>{renderDescription(activity)}</TableCell>
                <TableCell>
                  <CopyableText
                    content={hash}
                    displayText={truncateString({
                      str: hash,
                    })}
                    classNames={{
                      displayText: "sm:text-2xl",
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

      <CustomPagination
        currentPage={filter.page}
        onPageChange={(page) => setFilter({ page })}
        pageSize={limit}
        totalCount={userActivities?.total ?? 0}
        variant="pair"
        onlyShowCurrentPage={!isDesktop}
      />
    </GlowContainer>
  );
};

const renderDescription = (activity: UserActivityType) => {
  const { pool, kind, uiAmountIn, uiAmountOut } = activity;

  // Create swap pool, create burn pool, cancel pool
  if ([0, 1, 5].includes(kind)) {
    const poolName = pool?.name;
    return (
      <p title={poolName} className="min-w-0 truncate text-left">
        {poolName}
      </p>
    );
  }

  // Deposit reward token, Deposit burn token, Stake, Join Launchpad
  if ([10, 30, 33, 36].includes(kind)) {
    return (
      <MetricNumber
        number={uiAmountIn}
        unit={pool?.tokenInSymbol}
        isShorten
        classNames={{
          container: "justify-start",
        }}
      />
    );
  }

  // Claim reward (burn & stake), Unstake, Claim Allocation, Reward Received
  if ([31, 35, 34, 37, 38].includes(kind)) {
    return (
      <MetricNumber
        number={uiAmountOut}
        unit={pool?.rewardTokenSymbol}
        isShorten
        classNames={{
          container: "justify-start",
        }}
      />
    );
  }

  // Swap, Deposit & Instant Claim
  if ([32, 39].includes(kind)) {
    return (
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-1">
        <MetricNumber
          number={uiAmountIn}
          unit={pool?.tokenInSymbol}
          isShorten
          classNames={{
            container: "max-w-max",
          }}
        />
        <ArrowRight className="size-4 shrink-0 sm:size-6" />
        <MetricNumber
          number={uiAmountOut}
          unit={pool?.rewardTokenSymbol}
          isShorten
          classNames={{
            container: "max-w-max",
          }}
        />
      </div>
    );
  }

  return null;
};

export default MyActivityList;
