import Decimal from "decimal.js";
import MetricNumber from "./metric-number";

interface Props {
  inValue: string;
  outValue: string;
  inSymbol: string;
  outSymbol: string;
}

const RatioDisplay: React.FC<Props> = ({
  inValue,
  outValue,
  inSymbol,
  outSymbol,
}) => {
  const inValueDecimal = new Decimal(inValue);
  const outValueDecimal = new Decimal(outValue);

  if (inValueDecimal.isZero()) {
    return <span>-</span>;
  }

  const displayOutValue = outValueDecimal.div(inValueDecimal).toFixed(6);

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-0.5">
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
