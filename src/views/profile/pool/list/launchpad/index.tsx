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
import type { ParticipatedUserPool } from "@/services/userService";
import { truncateString } from "@/utils/helpers/string";
import TBDTooltip from "@/views/pool/glow/components/launchpad/tbd-tooltip";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: ParticipatedUserPool[];
  isLoading?: boolean;
  limit?: number;
}

const ProfilePoolListLaunchpad: React.FC<Props> = ({
  data,
  isLoading,
  limit = 10,
}) => {
  const navigate = useNavigate();

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

  return (
    <Table className="sm:text-2xl">
      <TableHeader className="sm:text-2xl">
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column}
              variant="launchpad"
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
          isLoading={isLoading}
        />
        {/* <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        /> */}

        {/* TODO: replace with real data */}
        {Array.from({ length: limit }).map((_, index) => (
          <TableRow key={index} variant="launchpad">
            {/* Pool name + address */}
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
              {index % 2 === 0 ? (
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
              ) : (
                <TBDTooltip />
              )}
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
  );
};

export default ProfilePoolListLaunchpad;
