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
import { chainIdToNetworkConfig } from "@/config/networks";
import type { PairItemType } from "@/types/pair";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  data?: PairItemType[];
  isLoading?: boolean;
}

const PairListGlowListTable: React.FC<Props> = ({ data, isLoading }) => {
  const columns = ["Pair", "Volume", "Liquidity", "Network", "Action"];

  const cellWidth: React.CSSProperties["width"] = `${100 / columns.length}%`;
  const fixWidth: React.CSSProperties["minWidth"] = `350px`;

  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={index}
              variant="pair"
              style={{
                width: index === 0 ? fixWidth : cellWidth, // 350px for first column
                minWidth: index === 0 ? fixWidth : "", // 350px for first column
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
        <TableNoData
          colSpan={columns.length}
          data={data}
          isLoading={isLoading}
        />
        {data?.map((item, index) => {
          const network = chainIdToNetworkConfig(item.chainId);

          const tokenOutDisplay = resolvePoolTokenDisplay({
            network,
            tokenAddress: item.tokenOut,
            tokenSymbol: item.tokenOutSymbol,
            tokenName: item.tokenOutSymbol,
            customName: item.tokenOutSymbolCustom ?? undefined,
            customSymbol: item.tokenOutSymbolCustom ?? undefined,
            imageUri: item.tokenOutImageUri ?? undefined,
          });

          const tokenInDisplay = resolvePoolTokenDisplay({
            network,
            tokenAddress: item.tokenIn,
            tokenSymbol: item.tokenInSymbol,
            tokenName: item.tokenInSymbol,
            customName: item.tokenInSymbolCustom ?? undefined,
            customSymbol: item.tokenInSymbolCustom ?? undefined,
            imageUri: item.tokenInImageUri ?? undefined,
          });

          const href = `/pair-detail/${item.chainId}/${item.tokenIn}/${item.tokenOut}`;

          return (
            <TableRow
              key={index}
              className={"cursor-pointer"}
              onClick={() => {
                navigate({
                  to: href,
                });
              }}
              variant="pair"
            >
              <TableCell
                style={
                  {
                    "--max-w": fixWidth,
                  } as React.CSSProperties
                }
                className="w-(--max-w) min-w-0"
              >
                <div className="flex min-w-0 items-center gap-3.25">
                  {/* Client wants the order to be token out / token in, refers to MB-415 */}
                  <TokenOutInInterceptDisplay
                    tokenOutProps={{
                      src: tokenOutDisplay.imageUri,
                      alt: tokenOutDisplay.symbol,
                    }}
                    tokenInProps={{
                      src: tokenInDisplay.imageUri,
                      alt: tokenInDisplay.symbol,
                    }}
                  />
                  {/* max-w - 51px - 63px - 13px = max-w - 127px (31.75) */}
                  <span
                    className="max-w-[calc(var(--max-w)-var(--spacing)*31.75)] min-w-0 truncate"
                    title={`${tokenOutDisplay.symbol} / ${tokenInDisplay.symbol}`}
                  >
                    {tokenOutDisplay.symbol} / {tokenInDisplay.symbol}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <MetricNumber number={item.volume} isShorten />
              </TableCell>
              <TableCell>
                <MetricNumber
                  number={item.liquidity}
                  unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                  isShorten
                />
              </TableCell>
              <TableCell>
                <NetworkDisplay
                  chainId={item.chainId}
                  classNames={{
                    container: "flex items-center gap-3 justify-center",
                    img: "mr-0",
                  }}
                />
              </TableCell>
              <TableCell className="pr-10">
                <Button
                  variant={"swap"}
                  hasGroupHover
                  className="font-orbitron"
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PairListGlowListTable;
