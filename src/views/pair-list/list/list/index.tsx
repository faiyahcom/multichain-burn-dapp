import { ArrowIcon } from "@/components/common/arrow-icon";
import InfoTooltip from "@/components/common/info-tooltip";
import NetworkImgIcon from "@/components/common/network-img-icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NETWORK_CONFIGS } from "@/config/networks";

// TODO: might need to change the type
type PairListListListLayoutItem = {
  id: string;
  pairName: string;
  volume: number;
  tvl: number;
  networkId: string;
};

// TODO: replace with real data
const demoData: PairListListListLayoutItem[] = [
  {
    id: "1",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "ethereumTestnet",
  },
  {
    id: "2",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "binanceTestnet",
  },
  {
    id: "3",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "xphereTestnet",
  },
  {
    id: "4",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "solanaDevnet",
  },
  {
    id: "5",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "ethereumTestnet",
  },
  {
    id: "6",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "binanceTestnet",
  },
  {
    id: "7",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "xphereTestnet",
  },
  {
    id: "8",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "solanaDevnet",
  },
  {
    id: "9",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "ethereumTestnet",
  },
  {
    id: "10",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "binanceTestnet",
  },
  {
    id: "11",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "xphereTestnet",
  },
  {
    id: "12",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    networkId: "solanaDevnet",
  },
];

interface Props {
  data?: PairListListListLayoutItem[];
}

const PairListListListLayout: React.FC<Props> = ({ data = demoData }) => {
  return (
    <div className="w-full pt-6 pl-27.5 pb-7">
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
          {data?.map((item, index) => {
            const networkConfig = NETWORK_CONFIGS.find(
              (n) => n.id === item.networkId,
            );

            return (
              <TableRow key={index}>
                <TableCell>
                  <NetworkImgIcon
                    src="/network/ethereum.png"
                    alt="Ethereum"
                    className="mr-px inline size-6.25"
                  />
                  <NetworkImgIcon
                    src="/network/usdt.svg"
                    alt="USDT"
                    className="mr-3.25 inline size-6.25"
                  />
                  <span>{item.pairName}</span>
                </TableCell>
                <TableCell>${item.volume.toLocaleString("de-DE")}</TableCell>
                <TableCell>${item.tvl.toLocaleString("de-DE")}</TableCell>
                <TableCell>
                  {networkConfig && (
                    <>
                      <NetworkImgIcon
                        src={networkConfig.iconSrc}
                        alt={networkConfig.label}
                        className="size-4.75 inline mr-1.5"
                      />
                      <span>{networkConfig.label}</span>
                    </>
                  )}
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
