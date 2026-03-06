import { ArrowIcon } from "@/components/common/arrow-icon";
import InfoTooltip from "@/components/common/info-tooltip";
import NetworkDisplay from "@/components/common/network-display";
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
          {data?.map((item, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3.25 pl-15.75">
                    <div className="flex items-center gap-px">
                      <TokenImage
                        src={item.tokenInImageUri}
                        alt={item.tokenInSymbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                      <TokenImage
                        src={item.tokenOutImageUri}
                        alt={item.tokenOutSymbol}
                        classNames={{
                          common: "size-6.25",
                        }}
                      />
                    </div>
                    <span>
                      {item.tokenInSymbolCustom ?? item.tokenInSymbol}/
                      {item.tokenOutSymbolCustom ?? item.tokenOutSymbol}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex w-full items-center justify-center gap-0.5">
                    <p
                      className="min-w-0 truncate"
                      title={Number(item.volume).toLocaleString("de-DE")}
                    >
                      {Number(item.volume).toLocaleString("de-DE")}
                    </p>
                    <p className="shrink-0">ETH</p>
                  </div>
                </TableCell>
                <TableCell>
                  {Number(item.tvl).toLocaleString("de-DE")} ETH
                </TableCell>
                <TableCell>
                  <NetworkDisplay chainId={item.chainId} />
                </TableCell>
                <TableCell>
                  <ArrowIcon direction="right" />
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
