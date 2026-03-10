import AnimateIconButton from "@/components/common/animate-icon-button";
import InfoTooltip from "@/components/common/info-tooltip";
import NoData from "@/components/common/no-data";
import TokenImage from "@/components/common/token-image";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { PairItemType } from "@/types/pair";
import { Link } from "@tanstack/react-router";
import { formatUnits } from "ethers";

interface Props {
  data?: PairItemType[];
  isLoading?: boolean;
}

const PairListListCardLayout: React.FC<Props> = ({ data, isLoading }) => {
  return (
    <div className="w-full pt-15.75 pr-7.25 pb-7 pl-22.5">
      {isLoading && (
        <div className="flex w-full items-center justify-center py-5">
          <Spinner />
        </div>
      )}
      <div className="grid w-full grid-cols-1 gap-x-8.5 gap-y-10.5 md:grid-cols-2 xl:grid-cols-3">
        <NoData
          isLoading={isLoading}
          data={data}
          classNames={{
            container: "col-span-1 md:col-span-2 xl:col-span-3",
          }}
        />
        {data?.map((item, index) => (
          <CardItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

const CardItem: React.FC<PairItemType> = ({
  tokenInImageUri,
  tokenOutImageUri,
  tokenInSymbol,
  tokenOutSymbol,
  tokenInSymbolCustom,
  tokenOutSymbolCustom,
  volume,
  tvl,
  chainId,
  tokenIn,
  tokenOut,
  tokenInDecimals,
  tokenOutDecimals,
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
          src={"/demo/pair-placeholder-img.png"}
          alt="Pair"
          className="h-full w-full rounded-t-14px object-cover"
        />
        <div className="absolute right-0 bottom-2 left-0">
          <div className="z-10 flex h-full w-full items-center gap-2.75 px-4.25 pt-0.75 pb-1 **:z-10">
            {/* Client wants the order to be token out / token in, refers to MB-415 */}
            <div className="flex items-center gap-px">
              <TokenImage
                src={tokenOutImageUri}
                alt={tokenOutSymbol}
                classNames={{
                  common: "size-5.75",
                }}
              />
              <TokenImage
                src={tokenInImageUri}
                alt={tokenInSymbol}
                classNames={{
                  common: "size-5.75",
                }}
              />
            </div>
            <p className="text-xl font-semibold">
              {tokenOutSymbolCustom ?? tokenOutSymbol}/
              {tokenInSymbolCustom ?? tokenInSymbol}
            </p>
          </div>
          <div className="absolute inset-0 z-0 h-full w-full bg-primary-foreground/50 backdrop-blur-[15px]" />
        </div>
      </div>

      <div className="space-y-1 bg-primary-foreground pt-1.75 pr-3.75 pb-1.25 pl-4.25">
        <CardInfoRow
          title="Volume"
          tooltipContent="The total value of burn tokens deposited by taker into Swap Pools and Burn Pools of the pair"
          value={Number(formatUnits(volume ?? 0, tokenInDecimals)) || 0}
          unit={tokenInSymbolCustom ?? tokenInSymbol}
        />
        <CardInfoRow
          title="TVL"
          tooltipContent="The total amount of reward tokens deposited by all makers when creating Swap Pools and Burn Pools within the same pair."
          value={Number(formatUnits(tvl ?? 0, tokenOutDecimals)) || 0}
          unit={tokenOutSymbolCustom ?? tokenOutSymbol}
        />
      </div>

      <Link to={`/pair-detail/${chainId}/${tokenIn}/${tokenOut}`}>
        <AnimateIconButton
          variant="letter-icon"
          iconLetter="V"
          color="#6E37FF"
          text="View Details"
          textVariant="text-container-center"
          classNames={{
            btn: "w-full rounded-t-none bg-primary-foreground after:rounded-t-none hover:border-active rounded-b-sm after:rounded-b-sm after:text-primary-foreground",
          }}
        />
      </Link>
    </div>
  );
};

interface CardInfoRowProps {
  title: string;
  tooltipContent?: string;
  value: number;
  unit?: string;
}

const CardInfoRow: React.FC<CardInfoRowProps> = ({
  title,
  tooltipContent,
  value,
  unit,
}) => {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex min-w-22.5 items-center gap-0.75">
        <p className="text-15px font-normal">{title}:</p>
        <InfoTooltip
          content={tooltipContent}
          classNames={{
            icon: "size-4.25",
          }}
        />
      </div>
      <div className="flex min-w-0 items-center gap-0.5 text-xl font-normal text-mb-card-value-blue">
        <p className="min-w-0 truncate" title={value.toLocaleString("de-DE")}>
          {value.toLocaleString("de-DE")}
        </p>
        <p>{unit}</p>
      </div>
    </div>
  );
};

export default PairListListCardLayout;
