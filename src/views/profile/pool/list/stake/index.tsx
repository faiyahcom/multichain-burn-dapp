import CopyableText from "@/components/common/copyable-text";
import { Button } from "@/components/common/glow/button";
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
  limit?: number;
}

const ProfilePoolListStake: React.FC<Props> = ({
  data,
  isLoading,
  limit = 10,
}) => {
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

  return (
    <Table className="sm:text-2xl">
      <TableHeader className="sm:text-2xl">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
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
        {/* <TableSkeleton
          colCount={columns.length}
          rowCount={limit}
          isLoading={isLoading}
        />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        /> */}

        {/* TODO: implement stake pool list */}

        {/* TODO: remove demo data */}
        {Array.from({ length: limit }, (_, i) => (
          <TableRow
            key={i}
            className="cursor-pointer font-medium"
            variant="pair"
          >
            <TableCell className="min-w-0 space-y-1 text-left">
              <p className="max-w-38.75 min-w-0 truncate" title={"YUNA 12"}>
                {"YUNA 12"}
              </p>
              <CopyableText
                content={"0x1234567890123456789012345678901234567890"}
                displayText={truncateString({
                  str: "0x1234567890123456789012345678901234567890",
                })}
                classNames={{
                  container: "justify-start",
                }}
              />
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
                variant={"pair"}
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

export default ProfilePoolListStake;
