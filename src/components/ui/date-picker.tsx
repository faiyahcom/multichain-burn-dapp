import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: (date: Date) => boolean;
    className?: string;
};

export function DatePicker({
    value,
    onChange,
    placeholder = "DD/MM/YY",
    disabled,
    className,
}: DatePickerProps) {

    // Internal state for hour and minute
    const [internalDate, setInternalDate] = React.useState<Date | undefined>(value);
    const [hour, setHour] = React.useState<string>(value && value instanceof Date ? String(value.getHours()).padStart(2, "0") : "00");
    const [minute, setMinute] = React.useState<string>(value && value instanceof Date ? String(value.getMinutes()).padStart(2, "0") : "00");

    // Only sync from value if value is different from internal state
    React.useEffect(() => {
        if (!value) return;
        if (!internalDate || value.getTime() !== internalDate.getTime() ||
            hour !== String(value.getHours()).padStart(2, "0") ||
            minute !== String(value.getMinutes()).padStart(2, "0")
        ) {
            setInternalDate(value);
            setHour(String(value.getHours()).padStart(2, "0"));
            setMinute(String(value.getMinutes()).padStart(2, "0"));
        }
    }, [value]);

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
    }, [internalDate, hour, minute]);

    const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
    const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "flex items-center justify-between gap-2 rounded-lg bg-inactive text-sm font-normal text-foreground hover:bg-inactive/80",
                        !value && "text-secondary-text",
                        className,
                    )}
                >
                    <CalendarIcon className="size-5 shrink-0 text-secondary-text" />
                    <span className="flex-1 text-left">
                        {value ? format(value, "dd/MM/yy HH:mm") : placeholder}
                    </span>
                    <svg
                        className="size-4 shrink-0 text-foreground"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={internalDate}
                    onSelect={d => setInternalDate(d || undefined)}
                    disabled={disabled}
                    autoFocus
                />
                <div className="flex items-center justify-center gap-4 p-4 border-t border-border bg-background">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">Hour</span>
                        <select
                            className="rounded-md bg-inactive border border-border px-3 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                            value={hour}
                            onChange={e => setHour(e.target.value)}
                        >
                            {hourOptions.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-lg font-bold text-muted-foreground">:</span>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-1">Minute</span>
                        <select
                            className="rounded-md bg-inactive border border-border px-3 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                            value={minute}
                            onChange={e => setMinute(e.target.value)}
                        >
                            {minuteOptions.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
