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
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import RatioDisplay from "@/components/common/ratio-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import {
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { truncateString } from "@/utils/helpers/string";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
  limit?: number;
}

const ProfilePoolListSwap: React.FC<Props> = ({
  data,
  isLoading,
  limit = 10,
}) => {
  const navigate = useNavigate();
  const columns = ["Pool", "Ratio", "Network", "Liquidity", "Volume", "Status"];
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
        <TableSkeleton
          colCount={columns.length}
          rowCount={limit}
          isLoading={isLoading}
        />
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        />

        {data?.map((pool) => {
          const network = chainIdToNetworkConfig(pool.chainId);

          const tokenOutDisplay = resolvePoolTokenDisplay({
            network,
            tokenAddress: pool.tokenOut,
            tokenSymbol: pool.tokenOutSymbol,
            tokenName: pool.tokenOutSymbol,
            customName: pool.tokenOutSymbolCustom ?? undefined,
            customSymbol: pool.tokenOutSymbolCustom ?? undefined,
            imageUri: pool.tokenOutImageUri ?? undefined,
          });

          const tokenInDisplay = resolvePoolTokenDisplay({
            network,
            tokenAddress: pool.tokenIn,
            tokenSymbol: pool.tokenInSymbol,
            tokenName: pool.tokenInSymbol,
            customName: pool.tokenInSymbolCustom ?? undefined,
            customSymbol: pool.tokenInSymbolCustom ?? undefined,
            imageUri: pool.tokenInImageUri ?? undefined,
          });
          return (
            <TableRow
              key={pool.address}
              className={"cursor-pointer"}
              onClick={() => {
                navigate({
                  to: `/swap/detail/${pool.address}`,
                });
              }}
              variant="pair"
            >
              <TableCell className="min-w-0 space-y-1 text-left">
                <p className="min-w-0 truncate max-w-38.75" title={pool.name}>
                  {pool.name}
                </p>
                <CopyableText
                  content={pool.address}
                  displayText={truncateString({
                    str: pool.address,
                  })}
                  classNames={{
                    container: "justify-start",
                  }}
                />
              </TableCell>
              <TableCell>
                <RatioDisplay
                  inValue={pool.rewardDenominator}
                  outValue={pool.rewardNumerator}
                  inSymbol={tokenInDisplay.symbol}
                  outSymbol={tokenOutDisplay.symbol}
                />
              </TableCell>
              <TableCell>
                <NetworkDisplay
                  chainId={pool.chainId}
                  classNames={{
                    container: "flex items-center",
                    img: "sm:mr-0.75 sm:size-7",
                  }}
                />
              </TableCell>
              <TableCell>
                <MetricNumber
                  number={pool.liquidity}
                  unit={tokenOutDisplay.symbol}
                  isShorten
                />
              </TableCell>
              <TableCell>
                <MetricNumber number={pool.volume} isShorten />
              </TableCell>
              <TableCell>
                <Button
                  variant={"pair"}
                  hasGroupHover
                  className="min-w-full font-orbitron"
                >
                  {getPoolStatusLabel(pool.status)}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ProfilePoolListSwap;
