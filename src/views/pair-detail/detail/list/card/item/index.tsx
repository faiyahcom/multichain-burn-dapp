import AnimateIconButton from "@/components/common/animate-icon-button";
import CopyableText from "@/components/common/copyable-text";
import MetricNumber from "@/components/common/metric-number";
import NetworkDisplay from "@/components/common/network-display";
import RatioDisplay from "@/components/common/ratio-display";
import TokenDisplay from "@/components/common/token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { cn } from "@/lib/utils";
import {
  getPoolStatusColor,
  getPoolStatusLabel,
  type PoolItemType,
} from "@/types/admin/master-pool-management";
import { sciToFormatted } from "@/utils/helpers/numbers";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import {
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { Link } from "@tanstack/react-router";
import type React from "react";

interface Props {
  data?: PoolItemType;
  displayValues?: ValueLineInfo[];
  swapPoolShowStatusAndRatio?: boolean;
  customActionBtn?: React.ReactNode;
  classNames?: {
    container?: string;
  };
}

const valueLineValues = [
  "volume",
  "tvl",
  "network",
  "token-in",
  "token-out",
  "ratio",
] as const;
export type ValueLineValue = (typeof valueLineValues)[number];

export type ValueLineInfo = {
  label: string;
  value: ValueLineValue;
};

const PairDetailDetailListCardItem: React.FC<Props> = ({
  data,
  displayValues = [
    {
      label: "Volume",
      value: "volume",
    },
    {
      label: "TVL",
      value: "tvl",
    },
  ],
  swapPoolShowStatusAndRatio = true,
  customActionBtn,
  classNames,
}) => {
  const isBurnPool = data?.kind === 0;

  if (!data) return null;

  return (
    <div
      className={cn(
        "space-y-2.25 rounded-t-md-plus rounded-b-sm border border-inactive bg-primary-foreground pt-2",
        classNames?.container,
      )}
    >
      {isBurnPool ? (
        <BurnPoolInfo data={data} />
      ) : (
        <SwapPoolInfo
          data={data}
          showStatusAndRatio={swapPoolShowStatusAndRatio}
        />
      )}
      <div className="space-y-1 pr-2 pl-2.25">
        {displayValues.map((info, index) => {
          return <ValueLineDisplay data={data} info={info} key={index} />;
        })}
      </div>
      {customActionBtn ? (
        customActionBtn
      ) : (
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
              btn: "rounded-t-none after:rounded-t-none w-full after:text-primary-foreground border-x-transparent border-b-transparent",
            }}
          />
        </Link>
      )}
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

const SwapPoolInfo = ({
  data,
  showStatusAndRatio = true,
}: {
  data?: PoolItemType;
  showStatusAndRatio?: boolean;
}) => {
  const showRatio =
    data?.rewardDenominator &&
    data?.rewardNumerator &&
    (data?.tokenInSymbolCustom || data?.tokenInSymbol) &&
    (data?.tokenOutSymbolCustom || data?.tokenOutSymbol) &&
    showStatusAndRatio;

  return (
    <div className="space-y-2 pr-2 pl-2.25">
      <div className="flex items-center justify-between gap-2.75">
        <PillText text="Swap Pool" className="w-1/2" />
        {data?.status && showStatusAndRatio && (
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
        {showRatio && (
          <RatioDisplay
            inValue={data?.rewardDenominator}
            outValue={data?.rewardNumerator}
            inSymbol={data?.tokenInSymbolCustom ?? data?.tokenInSymbol}
            outSymbol={data?.tokenOutSymbolCustom ?? data?.tokenOutSymbol}
            classNames={{
              container: "justify-end text-xs",
            }}
          />
        )}
      </div>
    </div>
  );
};

const ValueLineDisplay = ({
  data,
  info,
}: {
  data: PoolItemType;
  info: ValueLineInfo;
}) => {
  const renderValue = () => {
    const network = chainIdToNetworkConfig(data.chainId);

    const tokenOutDisplay = resolvePoolTokenDisplay({
      network,
      tokenAddress: data.tokenOut,
      tokenSymbol: data.tokenOutSymbol,
      tokenName: data.tokenOutSymbol,
      customName: data.tokenOutSymbolCustom ?? undefined,
      customSymbol: data.tokenOutSymbolCustom ?? undefined,
      imageUri: data.tokenOutImageUri ?? undefined,
    });

    const tokenInDisplay = resolvePoolTokenDisplay({
      network,
      tokenAddress: data.tokenIn,
      tokenSymbol: data.tokenInSymbol,
      tokenName: data.tokenInSymbol,
      customName: data.tokenInSymbolCustom ?? undefined,
      customSymbol: data.tokenInSymbolCustom ?? undefined,
      imageUri: data.tokenInImageUri ?? undefined,
    });
    switch (info.value) {
      case "volume":
        return (
          <MetricNumber
            isShorten
            number={sciToFormatted(data?.volume ?? 0, data?.tokenInDecimals)}
            unit={data?.tokenInSymbolCustom ?? data?.tokenInSymbol}
            classNames={{
              container: "justify-end",
            }}
          />
        );

      case "tvl":
        return (
          <MetricNumber
            isShorten
            number={sciToFormatted(data?.tvl ?? 0, data?.tokenOutDecimals)}
            unit={data?.tokenOutSymbolCustom ?? data?.tokenOutSymbol}
            classNames={{
              container: "justify-end",
            }}
          />
        );

      case "network":
        return (
          <NetworkDisplay
            chainId={data?.chainId}
            classNames={{
              img: "mr-0.75 size-4.25",
            }}
          />
        );

      case "token-in":
        return (
          <TokenDisplay
            symbol={tokenInDisplay.symbol}
            imageUri={tokenInDisplay.imageUri}
            className="size-4.25"
            classNames={{
              container: "justify-end",
            }}
          />
        );

      case "token-out":
        return (
          <TokenDisplay
            symbol={tokenOutDisplay.symbol}
            imageUri={tokenOutDisplay.imageUri}
            className="size-4.25"
            classNames={{
              container: "justify-end",
            }}
          />
        );

      case "ratio":
        return (
          <RatioDisplay
            inValue={data?.rewardDenominator}
            outValue={data?.rewardNumerator}
            inSymbol={data?.tokenInSymbolCustom ?? data?.tokenInSymbol}
            outSymbol={data?.tokenOutSymbolCustom ?? data?.tokenOutSymbol}
            classNames={{
              container: "justify-end",
            }}
          />
        );

      default:
        const _exhaustiveCheck: never = info.value;
        return _exhaustiveCheck;
    }
  };

  return <ValueLine title={info.label} value={renderValue()} />;
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
