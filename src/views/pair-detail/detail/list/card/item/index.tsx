import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import MetricNumber from "@/components/common/metric-number";
import { cn } from "@/lib/utils";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import { formatUnits } from "ethers";
import type React from "react";

interface Props {
  data?: PoolItemType;
}

const PairDetailDetailListCardItem: React.FC<Props> = ({ data }) => {
  const isBurnPool = data?.kind === 0;

  if (!data) return null;

  return (
    <div className="space-y-2.25 rounded-t-md-plus rounded-b-sm bg-primary-foreground pt-2">
      {isBurnPool ? <BurnPoolInfo data={data} /> : <SwapPoolInfo data={data} />}
      <div className="space-y-1 pr-2 pl-2.25">
        <ValueLine
          title="Volume"
          value={
            <MetricNumber
              number={formatUnits(data?.volume ?? 0, data?.tokenInDecimals)}
              unit={data?.tokenInSymbolCustom ?? data?.tokenInSymbol}
              classNames={{
                container: "justify-end",
              }}
            />
          }
        />
        <ValueLine
          title="TVL"
          value={
            <MetricNumber
              number={formatUnits(data?.tvl ?? 0, data?.tokenOutDecimals)}
              unit={data?.tokenOutSymbolCustom ?? data?.tokenOutSymbol}
              classNames={{
                container: "justify-end",
              }}
            />
          }
        />
      </div>
      <Link
        to={`/${isBurnPool ? "burn" : "swap"}/detail/${data?.address}`}
        className="block w-full"
      >
        <AnimateIconButton
          variant="letter-icon"
          iconLetter="V"
          color="#6E37FF"
          text="View Details"
          afterText="View Details >"
          textVariant="text-container-center"
          classNames={{
            btn: "rounded-t-none after:rounded-t-none w-full after:text-primary-foreground",
          }}
        />
      </Link>
    </div>
  );
};

const PillText = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex h-6.25 w-full items-center rounded-full bg-inactive px-3.25",
        className,
      )}
    >
      <p
        className="max-w-full min-w-0 truncate text-xl font-semibold text-mb-table-text"
        title={text}
      >
        {text}
      </p>
    </div>
  );
};

const BurnPoolInfo = ({ data }: { data?: PoolItemType }) => {
  const timeStart = formatTimestampSecondsToDate({
    timestamp: data?.timeStart,
    notFound: "",
  });
  const timeEnd = formatTimestampSecondsToDate({
    timestamp: data?.timeEnd,
    notFound: "",
  });

  return (
    <div className="flex w-full gap-2.75 pr-2 pl-2.25">
      <div className="w-1/2 space-y-0.5">
        <PillText text={data?.name} className="max-w-full" />
        <CopyableText
          content={data?.address}
          displayText={truncateString({ str: data?.address })}
          classNames={{
            container: "pl-3.25 justify-start",
          }}
        />
      </div>
      <div className="w-1/2">
        {timeStart && timeEnd && (
          <p className="text-right text-tiny font-medium text-mb-gray-b5b7ca">
            {timeStart} - {timeEnd}
          </p>
        )}
        {data?.status && (
          <AnimateIconButton
            variant="letter-icon"
            iconLetter={getPoolStatusLabel(data.status).slice(0, 1)}
            textVariant="text-self-center"
            color={getPoolStatusColor(data.status)}
            text={getPoolStatusLabel(data.status)}
            classNames={{
              btn: "w-full max-w-29 ml-auto",
            }}
          />
        )}
      </div>
    </div>
  );
};

const SwapPoolInfo = ({ data }: { data?: PoolItemType }) => {
  return (
    <div className="space-y-2 pr-2 pl-2.25">
      <div className="flex items-center justify-between gap-2.75">
        <PillText text="Swap Pool" className="w-1/2" />
        {data?.status && (
          <AnimateIconButton
            variant="letter-icon"
            iconLetter={getPoolStatusLabel(data.status).slice(0, 1)}
            textVariant="text-self-center"
            color={getPoolStatusColor(data.status)}
            text={getPoolStatusLabel(data.status)}
            classNames={{
              btn: "w-full max-w-29 ml-auto",
            }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2.75">
        <CopyableText
          content={data?.address}
          displayText={truncateString({ str: data?.address })}
          classNames={{
            container: "pl-3.25",
          }}
        />
        <p className="text-xs font-normal">
          {data?.rewardDenominator}{" "}
          {data?.tokenInSymbolCustom ?? data?.tokenInSymbol} ={" "}
          {data?.rewardNumerator}{" "}
          {data?.tokenOutSymbolCustom ?? data?.tokenOutSymbol}
        </p>
      </div>
    </div>
  );
};

const ValueLine = ({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between gap-2.75 pl-2.25">
      <p className="min-w-15 text-15px font-normal text-mb-gray-69">{title}</p>
      {value}
    </div>
  );
};

export default PairDetailDetailListCardItem;
