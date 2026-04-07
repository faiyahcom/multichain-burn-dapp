import { cn } from "@/lib/utils";
import { formatTimestampSecondsToDate } from "@/utils/helpers/string";

interface Props {
  startDate?: string;
  endDate?: string;
  classNames?: {
    container?: string; // needed for wide screen
    dash?: string; // needed for wide screen
  };
}

const StartEndDateDisplay: React.FC<Props> = ({
  startDate,
  endDate,
  classNames,
}) => {
  const timeStart = formatTimestampSecondsToDate({
    timestamp: startDate,
    notFound: "",
  });
  const timeEnd = formatTimestampSecondsToDate({
    timestamp: endDate,
    notFound: "",
  });

  if (!timeStart && !timeEnd) return null;
  if (timeStart && !timeEnd) {
    return <span>{timeStart} - N/A</span>;
  }
  if (!timeStart && timeEnd) {
    return <span>N/A - {timeEnd}</span>;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-0.5",
        classNames?.container,
      )}
    >
      <span>{timeStart}</span>
      <span className={cn("hidden", classNames?.dash)}>-</span>
      <span>{timeEnd}</span>
    </div>
  );
};

export default StartEndDateDisplay;
