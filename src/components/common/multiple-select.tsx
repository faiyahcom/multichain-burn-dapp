import {
  CheckIcon,
  ChevronDown,
  SquareCheckIcon,
  SquareIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";

export interface MultipleSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Props {
  options?: MultipleSelectOption[];
  selected?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
}

const MultipleSelect: React.FC<Props> = ({
  options,
  selected,
  onChange,
  placeholder = "Select",
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={"mb-inactive"} size={"mb-btn"}>
          <div className="size-4" />
          {placeholder} <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select</PopoverTitle>
          <PopoverDescription>Select multiple options</PopoverDescription>
        </PopoverHeader>
        <div className="space-y-1">
          {options?.map((option, index) => (
            <OptionItem
              key={index}
              label={option.label}
              value={option.value}
              icon={option.icon}
              checked={selected?.includes(option.value)}
              // onCheckedChange={({ checked, value }) => {
              //     if (checked) {
              //         setSelected([...selected, value]);
              //     } else {
              //         setSelected(selected.filter((v) => v !== value));
              //     }
              // }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface OptionItemProps {
  checked?: boolean;
  onCheckedChange?: ({
    checked,
    value,
  }: {
    checked: boolean;
    value: string;
  }) => void;
}

const OptionItem: React.FC<MultipleSelectOption & OptionItemProps> = ({
  label,
  value,
  icon,
  checked,
  onCheckedChange,
}) => {
  const Icon = icon;
  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-2.5 rounded-5px px-4 pt-2 pb-1.75 bg-primary-foreground"
      onClick={() =>
        onCheckedChange?.({
          checked: !checked,
          value,
        })
      }
    >
      <div className="flex items-center gap-2.5">
        {checked ? (
          <SquareCheckIcon className="text-mb-check-blue" />
        ) : (
          <SquareIcon className="text-mb-check-blue" />
        )}
        {Icon ? <Icon className="size-7.75" /> : <div className="size-7.75" />}
        <span className="text-15px font-medium">{label}</span>
      </div>
      {checked ? (
        <CheckIcon className="text-mb-check-blue" />
      ) : (
        <div className="size-4" />
      )}
    </div>
  );
};

export default MultipleSelect;
