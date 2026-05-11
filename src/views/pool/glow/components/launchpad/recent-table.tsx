import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import LaunchpadCategoryIcon from "@/components/common/glow/icon/launchpad-category-icon";
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
import TokenOutInInterceptDisplay from "@/components/common/glow/token-out-in-intercept-display";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import StartEndDateDisplay from "@/components/common/start-end-date-display";
import { useAuthStore } from "@/stores/authStore";
import { truncateString } from "@/utils/helpers/string";
import { Link, useNavigate } from "@tanstack/react-router";

const LaunchpadRecentPoolsTable = () => {
  const navigate = useNavigate();
  const { user, _hasHydrated } = useAuthStore();
  const isAuthenticated = _hasHydrated && !!user?.address;

  const columns = [
    "Project",
    "Time",
    "Mode",
    "Pair",
    "Deposited",
    "Received",
    "Network",
    "Status",
  ];
  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `200px`;

  return (
    <>
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={column}
                  variant="launchpad"
                  className="h-12 pt-2 align-baseline"
                  style={{
                    width: index === 0 ? fixWidth : cellWidth, // 200px for first column
                    minWidth: index === 0 ? fixWidth : "", // 200px for first column
                  }}
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAuthenticated && (
              <TableSkeleton
                colCount={columns.length}
                rowCount={2}
                // isLoading={isRecentPoolsPending}
              />
            )}
            {/* {isAuthenticated && (
              <TableNoData
                colSpan={columns.length}
                // data={recentPools?.pools}
                // isLoading={isRecentPoolsPending}
                text="No pools found"
              />
            )} */}

            {/* TODO: implement */}

            {/* TODO: remove demo data */}
            {Array.from({ length: 2 }).map((_, index) => (
              <TableRow key={index} variant="launchpad">
                {/* Pool name + address */}
                <TableCell
                  className="w-(--max-w) min-w-0 text-left"
                  style={
                    {
                      "--max-w": fixWidth,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                    <LaunchpadCategoryIcon className="size-10.75" />
                    {/* max-w - spacing * (10.75 + 3) */}
                    <div className="max-w-[calc(var(--max-w)-var(--spacing)*13.75)] min-w-0">
                      <p
                        className="max-w-full min-w-0 truncate font-semibold"
                        title={"Yuna 12"}
                      >
                        {"Yuna 12"}
                      </p>
                      <CopyableText
                        content={"0x1234567890123456789012345678901234567890"}
                        displayText={truncateString({
                          str: "0x1234567890123456789012345678901234567890",
                        })}
                        classNames={{
                          container: "justify-start",
                          displayText: "text-base sm:text-xl",
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                {/* Time */}
                <TableCell>
                  <StartEndDateDisplay
                    startDate={"1778233567"}
                    endDate={"1778233567"}
                    classNames={{
                      container: "mx-auto w-max",
                    }}
                  />
                </TableCell>
                {/* Mode */}
                <TableCell>{index % 2 === 0 ? "Fixed" : "Dynamic"}</TableCell>
                {/* Pair */}
                <TableCell>
                  <TokenOutInInterceptDisplay
                    tokenOutProps={
                      {
                        //   src: tokenRewardDisplay.imageUri,
                        //   alt: tokenRewardDisplay.symbol,
                      }
                    }
                    tokenInProps={
                      {
                        //   src: tokenInDisplay.imageUri,
                        //   alt: tokenInDisplay.symbol,
                      }
                    }
                    className="justify-center"
                  />
                </TableCell>
                {/* Deposited */}
                <TableCell>
                  <MetricNumber
                    // number={sciToFormatted(
                    //   pool?.stakedAmount,
                    //   pool?.tokenInDecimals,
                    // )}
                    number={123456789}
                    // unit={tokenInDisplay.symbol}
                    unit={"USDT"}
                    isShorten
                  />
                </TableCell>
                {/* Received */}
                <TableCell>
                  <MetricNumber
                    // number={sciToFormatted(
                    //   pool?.stakedAmount,
                    //   pool?.tokenInDecimals,
                    // )}
                    number={123456789}
                    // unit={tokenInDisplay.symbol}
                    unit={"USDT"}
                    isShorten
                  />
                </TableCell>
                {/* Network */}
                <TableCell>
                  <NetworkDisplay
                    // chainId={pool?.chainId}
                    networkId="xphere"
                    classNames={{
                      container: "flex items-center justify-center gap-3",
                    }}
                  />
                </TableCell>
                {/* Status */}
                <TableCell className="w-max max-w-max min-w-max">
                  <Button
                    variant={"launchpad"}
                    hasGroupHover
                    className="sm:text-24px min-w-full rounded-13px px-6 py-2 font-orbitron text-xl font-semibold"
                  >
                    {/* {statusLabel} */}
                    Live
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* {isAuthenticated && ( */}
        <div className="flex justify-end">
          <Link
            to="/my-participated-pools"
            search={{
              tab: "launchpad",
            }}
            className="sm:text-24px pr-3 font-inter text-xl font-semibold"
          >
            See more
          </Link>
        </div>
        {/* )} */}
      </div>
    </>
  );
};

export default LaunchpadRecentPoolsTable;
