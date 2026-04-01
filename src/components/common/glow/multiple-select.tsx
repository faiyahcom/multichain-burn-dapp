import { IconCheck, IconSquare, IconSquareCheck } from "@/assets/react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../ui/popover";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import { getVariantBorderClassName, type ContainerVariant } from "./container";
import { DownTriangleIcon } from "./down-triangle-icon";
import { useState } from "react";

export interface MultipleSelectOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface Props {
  options?: MultipleSelectOption[];
  selected?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string; // Usually the label of the category filtering, like "Network", "Status", etc.
  placeholderMultiple?: string; // This is for when the placeholder has a special plural form. This is used when all is selected. If not provided, it will be "All {placeholder}s"
  showIconsInTriggerIfAny?: boolean;
  classNames?: {
    btn?: string;
    content?: string;
    item?: string;
  };
  defaultValuesWhenUncheckAll?: string[]; // By default, "clear" like action will result in an empty array. This will override that behavior.
  variant: ContainerVariant;
}

const MultipleSelect: React.FC<Props> = ({
  options,
  selected,
  onChange,
  placeholder = "Select",
  placeholderMultiple = "",
  showIconsInTriggerIfAny = true,
  classNames,
  defaultValuesWhenUncheckAll,
  variant,
}) => {
  const [open, setOpen] = useState(false);

  const isAllSelected =
    options && options.length > 0 && selected?.length === options.length;
  const isAnySelected = (selected?.length ?? 0) > 0;
  const showIcon =
    showIconsInTriggerIfAny && options?.some((option) => option.icon);
  const selectedLabels = selected
    ?.map((value) => options?.find((option) => option.value === value)?.label)
    .filter(Boolean);

  // "All Tokens" label — use placeholderMultiple if provided, else just placeholder
  // (avoids "All All Tokens" when placeholder already says "All Tokens")
  const allLabel = placeholderMultiple
    ? placeholderMultiple
    : `All ${placeholder}s`;

  const handleToggleAllCheck = () => {
    if (selected?.length === options?.length) {
      if (defaultValuesWhenUncheckAll) {
        onChange?.(defaultValuesWhenUncheckAll);
      } else {
        onChange?.([]);
      }
    } else {
      onChange?.(options?.map((option) => option.value) ?? []);
    }
  };

  const handleClearAllCheck = () => {
    if (defaultValuesWhenUncheckAll) {
      onChange?.(defaultValuesWhenUncheckAll);
    } else {
      onChange?.([]);
    }
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={getButtonVariantFromContainerVariant({
            containerVariant: variant,
            isActive: false,
          })}
          size={"default"}
          className={cn("shrink-0", classNames?.btn)}
          title={
            isAnySelected
              ? `Selected: ${selectedLabels?.join(", ")}`
              : placeholder
          }
        >
          <div />
          {isAnySelected ? (
            <div className="flex min-w-0 items-center gap-1.75">
              {showIcon && (
                <SelectedIcons
                  icons={options
                    ?.filter((option) => selected?.includes(option.value))
                    ?.map((option) => option.icon)
                    ?.filter((icon) => icon !== undefined)}
                />
              )}
              {isAllSelected ? (
                <span className={classNames?.item}>{allLabel}</span>
              ) : (
                <span className={cn("min-w-0 truncate", classNames?.item)}>
                  {options
                    ?.filter((option) => selected?.includes(option.value))
                    ?.map((option) => option.label)
                    ?.join(", ")}
                </span>
              )}
            </div>
          ) : (
            placeholder
          )}{" "}
          <DownTriangleIcon direction={open ? "up" : "down"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "space-y-2.5 pb-3",
          getVariantBorderClassName({
            variant,
            custom: "rounded-5px border-4",
          }),
          "bg-mb-dark-popover thin-transparent-scrollbar",
          classNames?.content,
        )}
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
            label={allLabel}
            value=""
            checked={isAllSelected}
            toggleCheck={handleToggleAllCheck}
            classNames={classNames}
          />
          {options?.map((option, index) => (
            <OptionItem
              key={index}
              label={option.label}
              value={option.value}
              icon={option.icon}
              checked={selected?.includes(option.value)}
              toggleCheck={handleToggleCheck}
              classNames={classNames}
            />
          ))}
        </div>
        <div className="pl-3">
          <button
            className={cn(
              "text-15px font-medium text-mb-clear-blue",
              classNames?.item,
            )}
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
  classNames?: {
    item?: string;
  };
}

const OptionItem: React.FC<MultipleSelectOption & OptionItemProps> = ({
  label,
  value,
  icon,
  checked,
  toggleCheck,
  classNames,
}) => {
  const Icon = icon;
  return (
    <div
      className="flex cursor-pointer items-center justify-between gap-2.5 rounded-5px bg-mb-dark-popover-item px-4 pt-2 pb-1.75"
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
        <span
          className={cn("text-15px font-medium select-none", classNames?.item)}
        >
          {label}
        </span>
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

  if (count === 0) return null;

  return (
    <div className="flex items-center">
      {count < 5 ? (
        icons?.map((Icon, index) => (
          <Icon
            key={index}
            className={cn("-ml-1.25 size-5 shrink-0 md:size-7.5", {
              "ml-0": count === 1,
            })}
          />
        ))
      ) : (
        <>
          {icons?.slice(0, 3).map((Icon, index) => (
            <Icon
              key={index}
              className="-ml-1.25 size-5 shrink-0 md:size-7.5"
            />
          ))}
          <div className="-ml-1.25 flex size-5 shrink-0 items-center justify-center rounded-full bg-inactive text-tiny font-bold md:size-7.5">
            +{count - 3}
          </div>
        </>
      )}
    </div>
  );
};

export default MultipleSelect;
