import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
import StakeCategoryIcon from "@/components/common/glow/icon/stake-category-icon";
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

const StakePoolListTable: React.FC<Props> = ({ data, isLoading }) => {
  const navigate = useNavigate();

  const columns = [
    "Pool",
    "Time",
    "Token",
    "Staked Amount",
    "APR",
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
              variant="stake"
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
        {/* <TableSkeleton
          colCount={columns.length}
          rowCount={12}
          isLoading={isLoading}
        />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        /> */}
        {/* TODO: implement stake pool list */}

        {/* TODO: remove demo data */}
        {Array.from({ length: 2 }, (_, i) => (
          <TableRow
            key={i}
            className="cursor-pointer font-medium"
            variant="stake"
          >
            <TableCell
              className="w-(--max-w) min-w-0 text-left"
              style={
                {
                  "--max-w": fixWidth,
                } as React.CSSProperties
              }
            >
              <div className="flex max-w-(--max-w) min-w-0 items-center gap-3">
                <StakeCategoryIcon className="size-10.75 shrink-0" />
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
            <TableCell>
              <StartEndDateDisplay
                startDate={"1776271167"}
                endDate={"1776271167"}
                classNames={{
                  container: "mx-auto w-max",
                }}
              />
            </TableCell>
            <TableCell>
              <TokenOutInInterceptDisplay
                tokenOutProps={{}}
                tokenInProps={{}}
                className="justify-center"
              />
            </TableCell>
            <TableCell>
              <MetricNumber number={123456} unit="USDT" isShorten />
            </TableCell>
            <TableCell>
              <MetricNumber
                number={0.5}
                unit="%"
                isShorten
                classNames={{
                  container: "gap-0",
                }}
              />
            </TableCell>
            <TableCell>
              <NetworkDisplay
                networkId="xphere"
                classNames={{
                  container: "flex items-center justify-center gap-3",
                }}
              />
            </TableCell>
            <TableCell className="w-max max-w-max min-w-max">
              <Button
                variant={"stake"}
                hasGroupHover
                className="sm:text-24px min-w-full rounded-13px px-6 py-2 font-orbitron text-xl font-semibold"
              >
                {"Live"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StakePoolListTable;
