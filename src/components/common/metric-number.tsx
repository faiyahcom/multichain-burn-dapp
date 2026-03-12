import { cn } from "@/lib/utils";
import Decimal from "decimal.js";
import numbro from "numbro";

interface Props {
  number?: number | string;
  unit?: string;
  classNames?: {
    container?: string;
  };
  isShorten?: boolean;
}

const MetricNumber: React.FC<Props> = ({
  number,
  unit,
  classNames,
  isShorten = false,
}) => {
  if (number === "" || number === null || number === undefined) {
    return null;
  }

  try {
    new Decimal(number);
  } catch (error) {
    return null;
  }

  const d = new Decimal(number).toDecimalPlaces(6);
  const isNegative = d.isNegative();
  const abs = d.abs();
  const [intPart, decPart] = abs.toFixed().split(".");

  const intFormatted = BigInt(intPart).toLocaleString("de-DE");
  const display =
    (isNegative ? "-" : "") +
    (decPart ? `${intFormatted},${decPart}` : intFormatted);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <p className="min-w-0 truncate uppercase" title={display}>
        {isShorten
          ? numbro(d.toNumber())
              .format({
                average: true,
                mantissa: 6,
                trimMantissa: true,
              })
              // This is a hack to fix numbro's formatting to match the design:
              // "." as thousands separator, "," as decimal separator
              .replace(/,/g, "#") // temp placeholder
              .replace(/\./g, ",") // . → ,
              .replace(/#/g, ".") // , → .
          : display}
      </p>
      {unit && <p className="shrink-0">{unit}</p>}
    </div>
  );
};

export default MetricNumber;
