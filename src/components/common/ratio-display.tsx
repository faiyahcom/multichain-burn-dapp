import { safeDecimalParse } from "@/utils/helpers/numbers";
import MetricNumber from "./metric-number";
import { cn } from "@/lib/utils";

interface Props {
  inValue: string;
  outValue: string;
  inSymbol: string;
  outSymbol: string;
  classNames?: {
    container?: string;
  };
}

const RatioDisplay: React.FC<Props> = ({
  inValue,
  outValue,
  inSymbol,
  outSymbol,
  classNames,
}) => {
  const inValueDecimal = safeDecimalParse({ value: inValue });
  const outValueDecimal = safeDecimalParse({ value: outValue });

  if (
    inValueDecimal === null ||
    outValueDecimal === null ||
    inValueDecimal.isZero()
  ) {
    return <span>-</span>;
  }

  const displayOutValue = outValueDecimal.div(inValueDecimal).toFixed(6);

  return (
    <div
      className={cn(
        "flex max-w-full flex-wrap items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <MetricNumber
        number={1}
        unit={inSymbol}
        classNames={{
          container: "max-w-max",
        }}
      />
      <span>=</span>
      <MetricNumber
        number={displayOutValue}
        unit={outSymbol}
        classNames={{
          container: "max-w-max",
        }}
      />
    </div>
  );
};

export default RatioDisplay;
