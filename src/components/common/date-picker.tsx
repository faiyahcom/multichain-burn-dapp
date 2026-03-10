import { CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { format } from "date-fns";
import { ArrowIcon } from "./arrow-icon";
import { cn } from "@/lib/utils";
import { Calendar } from "../ui/calendar";

interface Props {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  classNames?: {
    btn?: string;
    content?: string;
  };
}

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "DD/MM/YY",
  classNames,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"mb-inactive"}
          className={cn(classNames?.btn)}
          size={"mb-btn"}
        >
          <CalendarIcon className="size-5 shrink-0" />
          <span>{value ? format(value, "dd/MM/yy") : placeholder}</span>
          <ArrowIcon direction="down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto overflow-y-auto p-0", classNames?.content)}
        align="center"
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Date Picker</PopoverTitle>
          <PopoverDescription>Select a date</PopoverDescription>
        </PopoverHeader>
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => onChange?.(d || undefined)}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
