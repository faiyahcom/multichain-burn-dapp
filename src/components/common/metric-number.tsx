import { cn } from "@/lib/utils";

interface Props {
  number?: number | string;
  unit?: string;
  classNames?: {
    container?: string;
  };
}

const MetricNumber: React.FC<Props> = ({ number, unit, classNames }) => {
  if (
    number === "" ||
    number === null ||
    number === undefined ||
    isNaN(Number(number))
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <p
        className="min-w-0 truncate"
        title={Number(number).toLocaleString("de-DE")}
      >
        {Number(number).toLocaleString("de-DE")}
      </p>
      {unit && <p className="shrink-0">{unit}</p>}
    </div>
  );
};

export default MetricNumber;
