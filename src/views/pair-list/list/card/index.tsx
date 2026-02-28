import InfoTooltip from "@/components/common/info-tooltip";
import LetterIcon from "@/components/common/letter-icon";
import NetworkImgIcon from "@/components/common/network-img-icon";
import { cn } from "@/lib/utils";

// TODO: might need to change the type
type PairListListCardLayoutItem = {
  id: string;
  pairName: string;
  volume: number;
  tvl: number;
  img: string;
  pairImgs?: string[];
};

// TODO: replace with real data
const demoData: PairListListCardLayoutItem[] = [
  {
    id: "1",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/ethereum.png", "/network/usdt.svg"],
  },
  {
    id: "2",
    pairName: "BTC/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/binance.png", "/network/usdt.svg"],
  },
  {
    id: "3",
    pairName: "SOL/USDC",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/solana.png", "/network/usdc.png"],
  },
  {
    id: "4",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/ethereum.png", "/network/usdt.svg"],
  },
  {
    id: "5",
    pairName: "BTC/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/binance.png", "/network/usdt.svg"],
  },
  {
    id: "6",
    pairName: "SOL/USDC",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/solana.png", "/network/usdc.png"],
  },
  {
    id: "7",
    pairName: "ETH/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/ethereum.png", "/network/usdt.svg"],
  },
  {
    id: "8",
    pairName: "BTC/USDT",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/binance.png", "/network/usdt.svg"],
  },
  {
    id: "9",
    pairName: "SOL/USDC",
    volume: 1000,
    tvl: 1000,
    img: "/demo/sample.jpg",
    pairImgs: ["/network/solana.png", "/network/usdc.png"],
  },
];

const PairListListCardLayout = () => {
  return (
    <div className="w-full pt-15.75 pr-7.25 pb-7 pl-22.5">
      <div className="grid w-full grid-cols-1 gap-x-8.5 gap-y-10.5 md:grid-cols-2 xl:grid-cols-3">
        {demoData.map((item, index) => (
          <CardItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

const CardItem: React.FC<PairListListCardLayoutItem> = ({
  pairName,
  volume,
  tvl,
  img,
  pairImgs,
}) => {
  return (
    <div
      className={cn(
        "rounded-17px bg-primary-foreground px-6 py-3.5 transition-colors hover:bg-mb-card-bg-active",
        "relative before:absolute before:top-1/2 before:left-0 before:h-[calc(100%-var(--spacing)*7)] before:w-1.75 before:-translate-y-1/2 before:rounded-full before:bg-transparent before:transition-colors hover:before:bg-active",
      )}
    >
      <div className="relative aspect-315/243 w-full">
        <img
          src={img}
          alt="Pair"
          className="h-full w-full rounded-t-14px object-cover"
        />
        <div className="absolute right-0 bottom-2 left-0">
          <div className="z-10 flex h-full w-full items-center gap-2.75 px-4.25 pt-0.75 pb-1 **:z-10">
            <div className="flex items-center gap-px">
              {pairImgs?.map((img, index) => (
                <NetworkImgIcon
                  key={index}
                  src={img}
                  alt="Pair"
                  className="size-5.75"
                />
              ))}
            </div>
            <p className="text-xl font-semibold">{pairName}</p>
          </div>
          <div className="absolute inset-0 z-0 h-full w-full bg-primary-foreground/50 backdrop-blur-[15px]" />
        </div>
      </div>

      <div className="space-y-1 bg-primary-foreground pt-1.75 pr-3.75 pb-1.25 pl-4.25">
        <CardInfoRow
          title="Volume"
          tooltipContent="The total value of burn tokens deposited by taker into Swap Pools and Burn Pools of the pair"
          value={volume}
        />
        <CardInfoRow
          title="TVL"
          tooltipContent="The total amount of reward tokens deposited by all makers when creating Swap Pools and Burn Pools within the same pair."
          value={tvl}
        />
      </div>

      <button className="group flex w-full items-center justify-between gap-1 rounded-b-sm border border-inactive bg-primary-foreground px-5 pt-1.5 pb-2.25 transition-colors hover:border-active hover:bg-active">
        <LetterIcon
          letter="V"
          className="bg-active transition-opacity group-hover:opacity-0"
        />
        <span className="text-sm font-semibold transition-colors group-hover:text-primary-foreground">
          View Details
        </span>

        <div className="size-5.5" />
      </button>
    </div>
  );
};

interface CardInfoRowProps {
  title: string;
  tooltipContent?: string;
  value: number;
}

const CardInfoRow: React.FC<CardInfoRowProps> = ({
  title,
  tooltipContent,
  value,
}) => {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-0.75">
        <p className="text-15px font-normal">{title}:</p>
        <InfoTooltip
          content={tooltipContent}
          classNames={{
            icon: "size-4.25",
          }}
        />
      </div>
      <p className="text-xl font-normal text-mb-card-value-blue">
        ${value.toLocaleString("de-DE")}
      </p>
    </div>
  );
};

export default PairListListCardLayout;
