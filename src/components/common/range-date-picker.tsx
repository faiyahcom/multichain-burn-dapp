import type { DateRange } from "react-day-picker";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useMediaQuery } from "usehooks-ts";

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
  filterByText = "Filter by Date",
  calendarProps,
  classNames,
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)");

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
              : filterByText}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto overflow-y-auto bg-primary-foreground p-0 md:w-auto",
          classNames?.content,
        )}
        align="center"
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Range Date Picker</PopoverTitle>
          <PopoverDescription>Select a date range</PopoverDescription>
        </PopoverHeader>
        <Calendar
          mode="range"
          selected={value}
          onSelect={(d) => onChange?.(d || undefined)}
          defaultMonth={value?.from}
          numberOfMonths={isMobile ? 1 : 2}
          resetOnSelect
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
};

export default RangeDatePicker;
