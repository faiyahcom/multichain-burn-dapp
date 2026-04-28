import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { ArrowIcon } from "./arrow-icon";

export interface SingleSelectOption {
  label: string;
  value: string;
  triggerLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Props {
  options?: SingleSelectOption[];
  selected?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  classNames?: {
    btn?: string;
    content?: string;
  };
}

const SingleSelect: React.FC<Props> = ({
  options,
  selected,
  onChange,
  placeholder = "Select",
  open,
  onOpenChange,
  classNames,
}) => {
  const selectedOption = options?.find((option) => option.value === selected);
  const selectedLabel = selectedOption?.triggerLabel ?? selectedOption?.label;
  const SelectedIcon = selectedOption?.icon;

  const handleToggleCheck = (value?: string) => {
    if (!value) return;
    onChange?.(value);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={selected ? "mb-active" : "mb-inactive"}
          size={"mb-btn"}
          className={classNames?.btn}
        >
          {!!SelectedIcon ? (
            <div className="flex size-5.75 shrink-0 items-center justify-center">
              <SelectedIcon className="size-5.25 shrink-0" />
            </div>
          ) : (
            <div className="size-2.5 shrink-0" />
          )}
          <span>{selectedLabel ?? placeholder}</span>
          <ArrowIcon direction="down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("space-y-1 overflow-y-auto", classNames?.content)}
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select</PopoverTitle>
          <PopoverDescription>Select single option</PopoverDescription>
        </PopoverHeader>
        {options?.map((option, index) => (
          <OptionItem
            key={index}
            label={option.label}
            value={option.value}
            checked={selected === option.value}
            toggleCheck={handleToggleCheck}
            icon={option.icon}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};

interface OptionItemProps {
  checked?: boolean;
  toggleCheck?: (value?: string) => void;
}

const OptionItem: React.FC<SingleSelectOption & OptionItemProps> = ({
  label,
  value,
  checked,
  toggleCheck,
  icon,
}) => {
  const Icon = icon;

  return (
    <div
      className="cursor-pointer rounded-5px bg-primary-foreground py-0.5 pr-0.75"
      onClick={() => toggleCheck?.(value)}
    >
      <div className="relative pl-1">
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-1.75 rounded-full bg-transparent transition-colors",
            { "bg-active": checked },
          )}
        />
        <div
          className={cn(
            "flex items-center rounded-5px bg-transparent pt-2.5 pb-2.25 pl-11.25 transition-colors",
            { "bg-inactive": checked },
            { "pt-2 pb-1.75 pl-6.25": !!Icon },
          )}
        >
          <div className="flex items-center gap-2.25">
            {!!Icon && <Icon className="size-7.75 shrink-0" />}
            <p className="text-15px font-medium">{label}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleSelect;
