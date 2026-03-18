import { cn } from "@/lib/utils";
import { shortenNumber } from "@/utils/helpers/numbers";
import Decimal from "decimal.js";

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

  const intFormatted = BigInt(intPart).toLocaleString("en-US");
  const display =
    (isNegative ? "-" : "") +
    (decPart ? `${intFormatted}.${decPart}` : intFormatted);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <p className="min-w-0 truncate uppercase" title={display}>
        {isShorten
          ? shortenNumber({
              number: d.toNumber(),
            })
          : display}
      </p>
      {unit && <p className="shrink-0">{unit}</p>}
    </div>
  );
};

export default MetricNumber;
