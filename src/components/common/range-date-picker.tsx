import type { DateRange } from "react-day-picker";
import type { Calendar } from "../ui/calendar";
import { Popover, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface Props {
  value?: DateRange;
  onChange?: (date?: DateRange) => void;
  filterByText?: string;
  calendarProps?: Omit<React.ComponentProps<typeof Calendar>, "mode">;
  classNames?: {
    btn?: string;
    content?: string;
  };
}

const RangeDatePicker: React.FC<Props> = ({
  value,
  onChange,
  filterByText = "Date",
  calendarProps,
  classNames,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"mb-active"}
          className={cn(classNames?.btn)}
          size={"mb-btn"}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span>
            {value && value.from
              ? `${format(value.from, "yyyy.MM.dd")} ~ ${value.to ? format(value.to, "yyyy.MM.dd") : ""}`
              : `Filter by ${filterByText}`}
          </span>
        </Button>
      </PopoverTrigger>
    </Popover>
  );
};

export default RangeDatePicker;
