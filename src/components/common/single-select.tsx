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
}

interface Props {
  options?: SingleSelectOption[];
  selected?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
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
  classNames,
}) => {
  const selectedLabel = options?.find(
    (option) => option.value === selected,
  )?.label;

  const handleToggleCheck = (value?: string) => {
    if (!value) return;
    onChange?.(value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={selected ? "mb-active" : "mb-inactive"}
          size={"mb-btn"}
          className={classNames?.btn}
        >
          <div className="size-2.5 shrink-0" />
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
}) => {
  return (
    <div
      className="group cursor-pointer rounded-5px bg-primary-foreground py-0.5 pr-0.75"
      onClick={() => toggleCheck?.(value)}
    >
      <div className="relative pl-1">
        <div
          className={cn(
            "absolute top-0 left-0 h-full w-1.75 rounded-full bg-transparent transition-colors",
            { "bg-active": checked },
            "group-hover:bg-active",
          )}
        />
        <div
          className={cn(
            "flex items-center rounded-5px bg-transparent pt-2.5 pb-2.25 pl-11.25 transition-colors",
            { "bg-inactive": checked },
            "group-hover:bg-inactive",
          )}
        >
          <p className="text-15px font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default SingleSelect;
