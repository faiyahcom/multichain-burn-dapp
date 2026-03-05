import { IconCheck, IconSquare, IconSquareCheck } from "@/assets/react";
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
import { cn } from "@/lib/utils";

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
  placeholderMultiple?: string;
  showIconsInTriggerIfAny?: boolean;
  classNames?: {
    btn?: string;
    content?: string;
  };
}

const MultipleSelect: React.FC<Props> = ({
  options,
  selected,
  onChange,
  placeholder = "Select",
  placeholderMultiple = "",
  showIconsInTriggerIfAny = true,
  classNames,
}) => {
  const isAllSelected =
    options && options.length > 0 && selected?.length === options.length;
  const isAnySelected = (selected?.length ?? 0) > 0;
  const atLeastOneIcon =
    showIconsInTriggerIfAny && options?.some((option) => option.icon);
  const selectedLabels = selected?.map(
    (value) => options?.find((option) => option.value === value)?.label,
  ).filter(Boolean);

  const handleToggleAllCheck = () => {
    if (selected?.length === options?.length) {
      onChange?.([]);
    } else {
      onChange?.(options?.map((option) => option.value) ?? []);
    }
  };

  const handleClearAllCheck = () => {
    onChange?.([]);
  };

  const handleToggleCheck = (value?: string) => {
    if (!value) return;
    const isIncluded = selected?.includes(value);
    if (isIncluded) {
      onChange?.(selected?.filter((v) => v !== value) ?? []);
    } else {
      onChange?.([...(selected ?? []), value]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={isAnySelected ? "mb-active" : "mb-inactive"}
          size={"mb-btn"}
          className={classNames?.btn}
          title={
            isAnySelected
              ? `Selected: ${selectedLabels?.join(", ")}`
              : placeholder
          }
        >
          <div className="size-2.5" />
          {isAnySelected ? (
            atLeastOneIcon ? (
              <div className="flex items-center gap-1.75">
                <SelectedIcons
                  icons={options
                    ?.filter((option) => selected?.includes(option.value))
                    ?.map((option) => option.icon)
                    ?.filter((icon) => icon !== undefined)}
                />
                {isAllSelected && (
                  <span>
                    All{" "}
                    {placeholderMultiple
                      ? placeholderMultiple
                      : `${placeholder}s`}
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate">
                {isAllSelected
                  ? `All ${placeholderMultiple ? placeholderMultiple : `${placeholder}s`}`
                  : options
                      ?.filter((option) => selected?.includes(option.value))
                      ?.map((option) => option.label)
                      ?.join(", ")}
              </span>
            )
          ) : (
            placeholder
          )}{" "}
          <ArrowIcon direction="down" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("space-y-6 pb-6.75", classNames?.content)}
        // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
        style={{
          maxHeight: "var(--radix-popover-content-available-height)",
        }}
      >
        <PopoverHeader className="sr-only">
          <PopoverTitle>Select</PopoverTitle>
          <PopoverDescription>Select multiple options</PopoverDescription>
        </PopoverHeader>
        {/* 
            content max height - padding top (9px) - footer clear all (24px + 24px + 27px) 
            content max height - 84px (21 spacing)
        */}
        <div className="max-h-[calc(var(--radix-popover-content-available-height)-var(--spacing)*21)] space-y-1 overflow-y-auto">
          <OptionItem
            label={`All ${placeholder}`}
            value=""
            checked={isAllSelected}
            toggleCheck={handleToggleAllCheck}
          />
          {options?.map((option, index) => (
            <OptionItem
              key={index}
              label={option.label}
              value={option.value}
              icon={option.icon}
              checked={selected?.includes(option.value)}
              toggleCheck={handleToggleCheck}
            />
          ))}
        </div>
        <div className="pl-3">
          <button
            className="text-15px font-medium text-mb-clear-blue"
            onClick={handleClearAllCheck}
          >
            Clear All
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface OptionItemProps {
  checked?: boolean;
  toggleCheck?: (value?: string) => void;
}

const OptionItem: React.FC<MultipleSelectOption & OptionItemProps> = ({
  label,
  value,
  icon,
  checked,
  toggleCheck,
}) => {
  const Icon = icon;
  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-2.5 rounded-5px bg-primary-foreground px-4 pt-2 pb-1.75"
      onClick={() => toggleCheck?.(value)}
    >
      <div className="flex items-center gap-2.5">
        {checked ? (
          <IconSquareCheck className="size-4.5 text-mb-check-blue" />
        ) : (
          <IconSquare className="size-4.5 text-mb-check-blue" />
        )}
        {Icon ? (
          <Icon className="size-7.75 rounded-full" />
        ) : (
          <div className="size-7.75" />
        )}
        <span className="text-15px font-medium select-none">{label}</span>
      </div>
      {checked ? (
        <IconCheck className="h-2.5 w-3.75 text-mb-check-blue" />
      ) : (
        <div className="size-4" />
      )}
    </div>
  );
};

interface SelectedIconsProps {
  icons?: React.ComponentType<{ className?: string }>[];
}

const SelectedIcons: React.FC<SelectedIconsProps> = ({ icons }) => {
  const count = icons?.length ?? 0;

  return (
    <div className="flex items-center">
      {count < 5 ? (
        icons?.map((Icon, index) => (
          <Icon key={index} className="-ml-1.25 size-5.25" />
        ))
      ) : (
        <>
          {icons?.slice(0, 3).map((Icon, index) => (
            <Icon key={index} className="-ml-1.25 size-5.25" />
          ))}
          <div className="-ml-1.25 flex size-5.25 items-center justify-center rounded-full bg-inactive text-tiny font-bold">
            +{count - 3}
          </div>
        </>
      )}
    </div>
  );
};

export default MultipleSelect;
