import { cn } from "@/lib/utils";
import Decimal from "decimal.js";

interface Props {
  number?: number | string;
  unit?: string;
  classNames?: {
    container?: string;
  };
}

const MetricNumber: React.FC<Props> = ({ number, unit, classNames }) => {
  if (number === "" || number === null || number === undefined) {
    return null;
  }

  try {
    new Decimal(number);
  } catch (error) {
    return null;
  }

  const d = new Decimal(number).toDecimalPlaces(6);
  const [intPart, decPart] = d.toFixed().split(".");

  const intFormatted = BigInt(intPart).toLocaleString("de-DE");
  const display = decPart ? `${intFormatted},${decPart}` : intFormatted;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <p className="min-w-0 truncate" title={display}>
        {display}
      </p>
      {unit && <p className="shrink-0">{unit}</p>}
    </div>
  );
};

export default MetricNumber;
