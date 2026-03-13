import { ArrowIcon } from "@/components/common/arrow-icon";
import InfoTooltip from "@/components/common/info-tooltip";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import TableNoData from "@/components/common/table-no-data";
import TableSpinner from "@/components/common/table-spinner";
import TokenImage from "@/components/common/token-image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { PairItemType } from "@/types/pair";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { Link } from "@tanstack/react-router";

interface Props {
  data?: PairItemType[];
  isLoading?: boolean;
}

const PairListListListLayout: React.FC<Props> = ({ data, isLoading }) => {
  return (
    <div className="w-full pt-6 pb-7 pl-27.5">
      <Table className="table-auto">
        <TableHeader>
          <TableRow>
            <TableHead>Pair</TableHead>
            <TableHead>
              Volume{" "}
              <InfoTooltip content="The total value of burn tokens deposited by taker into Swap Pools and Burn Pools of the pair" />
            </TableHead>
            <TableHead>
              TVL{" "}
              <InfoTooltip content="The total amount of reward tokens deposited by all makers when creating Swap Pools and Burn Pools within the same pair." />
            </TableHead>
            <TableHead>Network</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSpinner isLoading={isLoading} colSpan={5} />
          <TableNoData colSpan={5} data={data} isLoading={isLoading} />
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

            return (
              <TableRow key={index}>
                <TableCell
                  style={{
                    "--max-w": "300px",
                  } as React.CSSProperties}
                className="w-(--max-w) min-w-0">
                  <div className="flex items-center gap-3.25 pl-15.75 min-w-0">
                    {/* Client wants the order to be token out / token in, refers to MB-415 */}
                    <div className="flex items-center gap-px min-w-0">
                      <TokenImage
                        src={tokenOutDisplay.imageUri}
                        alt={tokenOutDisplay.symbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                      <TokenImage
                        src={tokenInDisplay.imageUri}
                        alt={tokenInDisplay.symbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                    </div>
                    {/* max-w - 51px - 63px - 13px = max-w - 127px (31.75) */}
                    <span
                      className="min-w-0 truncate max-w-[calc(var(--max-w)-var(--spacing)*31.75)]"
                      title={`${tokenOutDisplay.symbol}/${tokenInDisplay.symbol}`}
                    >
                      {tokenOutDisplay.symbol}/{tokenInDisplay.symbol}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(item.volume, item.tokenInDecimals)}
                    unit={item.tokenInSymbolCustom ?? item.tokenInSymbol}
                    isShorten
                  />
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={sciToFormatted(item.tvl, item.tokenOutDecimals)}
                    unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                    isShorten
                  />
                </TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
                </TableCell>
                <TableCell className="pr-10">
                  <Link
                    to={`/pair-detail/${item.chainId}/${item.tokenIn}/${item.tokenOut}`}
                    className="block h-full w-full text-left"
                  >
                    <ArrowIcon direction="right" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PairListListListLayout;
