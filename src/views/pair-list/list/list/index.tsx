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
import type { PairItemType } from "@/types/pair";
import { Link } from "@tanstack/react-router";
import { formatUnits } from "ethers";

interface Props {
  data?: PairItemType[];
  isLoading?: boolean;
}

const PairListListListLayout: React.FC<Props> = ({ data, isLoading }) => {
  return (
    <div className="w-full pt-6 pb-7 pl-27.5">
      <Table>
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
            return (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex w-max items-center gap-3.25 pl-15.75">
                    {/* Client wants the order to be token out / token in, refers to MB-415 */}
                    <div className="flex items-center gap-px">
                      <TokenImage
                        src={item.tokenOutImageUri}
                        alt={item.tokenOutSymbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                      <TokenImage
                        src={item.tokenInImageUri}
                        alt={item.tokenInSymbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                    </div>
                    <span>
                      {item.tokenOutSymbolCustom ?? item.tokenOutSymbol}/
                      {item.tokenInSymbolCustom ?? item.tokenInSymbol}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={formatUnits(item.volume ?? 0, item.tokenInDecimals)}
                    unit={item.tokenInSymbolCustom ?? item.tokenInSymbol}
                  />
                </TableCell>
                <TableCell>
                  <MetricNumber
                    number={formatUnits(item.tvl ?? 0, item.tokenOutDecimals)}
                    unit={item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                  />
                </TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
                </TableCell>
                <TableCell>
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
