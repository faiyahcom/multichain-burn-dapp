import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  type ContainerVariant,
  getVariantBorderClassName,
  getVariantShadowClassName,
} from "./container";

const variantSelectedDayClass: Record<ContainerVariant, string> = {
  burn: "data-[selected-single=true]:!bg-mb-btn-burn",
  swap: "data-[selected-single=true]:!bg-mb-btn-swap",
  pair: "data-[selected-single=true]:!bg-mb-btn-pair",
  green: "data-[selected-single=true]:!bg-mb-btn-green",
  stake: "data-[selected-single=true]:!bg-mb-btn-stake",
};

type DatePickerProps = {
  variant?: ContainerVariant;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
};

export function DatePicker({
  variant = "burn",
  value,
  onChange,
  placeholder = "YYYY/MM/DD HH:mm",
  disabled,
  className,
}: DatePickerProps) {
  // Internal state for date, hour, and minute
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    value,
  );
  const [hour, setHour] = React.useState<string>(
    value instanceof Date ? String(value.getHours()).padStart(2, "0") : "00",
  );
  const [minute, setMinute] = React.useState<string>(
    value instanceof Date ? String(value.getMinutes()).padStart(2, "0") : "00",
  );

  // Only sync from value if value is different from internal state
  React.useEffect(() => {
    if (!value) return;
    if (
      !internalDate ||
      value.getTime() !== internalDate.getTime() ||
      hour !== String(value.getHours()).padStart(2, "0") ||
      minute !== String(value.getMinutes()).padStart(2, "0")
    ) {
      setInternalDate(value);
      setHour(String(value.getHours()).padStart(2, "0"));
      setMinute(String(value.getMinutes()).padStart(2, "0"));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only call onChange if the new date is different from value
  React.useEffect(() => {
    if (!internalDate) return;
    const updated = new Date(internalDate);
    updated.setHours(Number(hour));
    updated.setMinutes(Number(minute));
    updated.setSeconds(0);
    updated.setMilliseconds(0);
    if (!value || updated.getTime() !== value.getTime()) {
      onChange?.(updated);
    }
  }, [internalDate, hour, minute]); // eslint-disable-line react-hooks/exhaustive-deps

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const minuteOptions = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const borderClass = getVariantBorderClassName({ variant });
  const shadowClass = getVariantShadowClassName({ variant });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="mb-inactive"
          size="mb-btn"
          className={cn(
            "bg-transparent font-inter",
            borderClass,
            shadowClass,
            !value && "text-secondary-text",
            className,
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0 md:size-5" />
          <span className="flex-1 text-left">
            {value ? format(value, "yyyy/MM/dd HH:mm") : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-y-auto border border-mb-dark-popover-item-border bg-mb-dark-popover p-0 sm:w-fit"
        align="start"
        style={{ maxHeight: "var(--radix-popover-content-available-height)" }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Date Picker</PopoverTitle>
          <PopoverDescription>Select a date and time</PopoverDescription>
        </PopoverHeader>
        <Calendar
          mode="single"
          selected={internalDate}
          onSelect={(d) => setInternalDate(d || undefined)}
          disabled={disabled}
          autoFocus
          className="font-inter"
          classNames={{
            today: "rounded-md bg-accent text-accent-foreground",
            day_button: cn(
              "data-[selected-single=true]:rounded-md",
              variantSelectedDayClass[variant],
            ),
          }}
        />
        <div className="flex items-center justify-center gap-4 border-t border-border px-4 pt-3 pb-4">
          <div className="flex flex-col items-center font-inter">
            <span className="mb-1 text-xs text-muted-foreground">Hour</span>
            <select
              className="rounded-md border border-border bg-mb-dark-popover px-3 py-1 text-base font-medium text-foreground transition-colors focus:ring-2 focus:ring-mb-btn-burn/50 focus:outline-none"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
            >
              {hourOptions.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <span className="text-lg font-bold text-muted-foreground">:</span>
          <div className="flex flex-col items-center font-inter">
            <span className="mb-1 text-xs text-muted-foreground">Minute</span>
            <select
              className="rounded-md border border-border bg-mb-dark-popover px-3 py-1 text-base font-medium text-foreground transition-colors focus:ring-2 focus:ring-mb-btn-burn/50 focus:outline-none"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
            >
              {minuteOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
