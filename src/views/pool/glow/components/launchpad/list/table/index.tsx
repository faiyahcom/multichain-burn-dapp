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
import type { PoolItemType } from "@/types/admin/master-pool-management";
import { truncateString } from "@/utils/helpers/string";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const LaunchpadPoolListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  const columns = [
    "Project",
    "Time",
    "Mode",
    "Pair",
    "Price",
    "Raised",
    "Network",
    "Status",
  ];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `200px`;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              variant="launchpad"
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
        <TableSkeleton
          colCount={columns.length}
          rowCount={12}
          isLoading={isLoading}
        />
        {/* <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        /> */}

        {/* TODO: replace with real data */}
        {Array.from({ length: 12 }).map((_, index) => {
          const raised = 35000;
          const goal = 50000;
          const raisedPercent = (raised / goal) * 100;

          return (
            <TableRow
              key={index}
              variant="launchpad"
              className="cursor-pointer font-medium"
            >
              {/* Pool Name + Address */}
              <TableCell
                className="w-(--max-w) min-w-0 text-left"
                style={
                  {
                    "--max-w": fixWidth,
                  } as React.CSSProperties
                }
              >
                <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                  <LaunchpadCategoryIcon className="size-10.5 shrink-0" />
                  {/* max-w - spacing * (10.75 + 3) */}
                  <div className="max-w-[calc(var(--max-w)-var(--spacing)*13.75)] min-w-0">
                    <p
                      className="max-w-full min-w-0 truncate font-semibold"
                      title={"YUNA 12"}
                    >
                      {"YUNA 12"}
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
              {/* Price */}
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
              {/* Raised */}
              <TableCell>
                <MetricNumber
                  classNames={{ container: "inline-flex w-max" }}
                  number={raised}
                  isShorten
                />
                /
                <MetricNumber
                  classNames={{ container: "inline-flex w-max" }}
                  number={goal}
                  isShorten
                />{" "}
                (
                <MetricNumber
                  classNames={{ container: "inline-flex w-max gap-0" }}
                  number={raisedPercent}
                  unit="%"
                  isShorten
                />
                )
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
          );
        })}
      </TableBody>
    </Table>
  );
};

export default LaunchpadPoolListTable;
