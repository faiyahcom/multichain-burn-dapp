import { cn } from "@/lib/utils";
import {
  sortBysLabels,
  sortBysShortLabels,
  type SortBy,
  type SortOrder,
} from "@/types/common";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../ui/popover";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import {
  getVariantBorderClassName,
  getVariantBtnBg50ClassName,
  getVariantBtnBgClassName,
  type ContainerVariant,
} from "./container";
import { DownTriangleIcon } from "./down-triangle-icon";

export type SortByOption =
  | SortBy
  | { label: string; value: SortBy; shortLabel?: string };

interface Props {
  options?: SortByOption[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  setSortBy?: (sortBy: SortBy | undefined) => void;
  setSortOrder?: (sortOrder: SortOrder) => void;
  placeholder?: string;
  defaultSortBy?: SortBy; // deprecated due to new logic
  variant: ContainerVariant;
  classNames?: {
    container?: string;
    btn?: string;
    content?: string;
  };
}

const getShortlabel = ({
  options,
  sortBy,
  placeholder,
}: {
  options?: SortByOption[];
  sortBy?: SortBy;
  placeholder: string;
}) => {
  const option = options?.find(
    (option) =>
      (typeof option === "object" && option.value === sortBy) ||
      option === sortBy,
  );
  if (option) {
    if (typeof option === "object") {
      return option.shortLabel ?? sortBysShortLabels[option.value];
    }
    return sortBysShortLabels[option];
  }
  return sortBy ? sortBysShortLabels[sortBy] : placeholder;
};

const SortSelect: React.FC<Props> = ({
  options,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  placeholder = "Sort by",
  variant,
  classNames,
}) => {
  const isActive = sortBy !== undefined && sortBy !== "none";

  // New logic, cycle through asc <=> desc of the current sortBy (no escape to none)
  const handleToggleSort = (inputSortBy: SortBy) => {
    if (inputSortBy === "none") {
      return;
    }
    if (sortBy !== inputSortBy) {
      setSortBy?.(inputSortBy);
      setSortOrder?.("desc");
    } else if (sortOrder === "desc") {
      setSortOrder?.("asc");
    } else {
      setSortOrder?.("desc");
    }
  };

  return (
    <div className={classNames?.container}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={getButtonVariantFromContainerVariant({
              containerVariant: variant,
              isActive: false,
            })}
            size={"default"}
            className={classNames?.btn}
          >
            {isActive && <div className={cn("size-4")} />}
            {!isActive
              ? placeholder
              : getShortlabel({ options, sortBy, placeholder })}{" "}
            {isActive && (
              <DownTriangleIcon
                direction={sortOrder === "asc" ? "up" : "down"}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            getVariantBorderClassName({
              variant,
              custom: "rounded-5px border-4",
            }),
            "w-58.5 space-y-1 overflow-y-auto sm:w-75",
            "bg-mb-dark-popover",
            classNames?.content,
          )}
          // https://www.radix-ui.com/primitives/docs/components/popover#constrain-the-content-size
          style={{
            maxHeight: "var(--radix-popover-content-available-height)",
          }}
        >
          <PopoverHeader className="sr-only">
            <PopoverTitle>Sort by</PopoverTitle>
            <PopoverDescription>Sort by</PopoverDescription>
          </PopoverHeader>
          {options?.map((sortByItem) => {
            const hasCustomLabel = typeof sortByItem === "object";
            const isActive = hasCustomLabel
              ? sortByItem.value === sortBy
              : sortByItem === sortBy;
            return (
              <OptionItem
                key={hasCustomLabel ? sortByItem.value : sortByItem}
                sortBy={hasCustomLabel ? sortByItem.value : sortByItem}
                sortOrder={sortOrder}
                isActive={isActive}
                toggleSort={handleToggleSort}
                label={
                  hasCustomLabel ? sortByItem.label : sortBysLabels[sortByItem]
                }
                variant={variant}
              />
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface OptionItemProps {
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  isActive?: boolean;
  toggleSort?: (sortBy: SortBy) => void;
  label?: string;
  variant: ContainerVariant;
}

const OptionItem: React.FC<OptionItemProps> = ({
  sortBy,
  sortOrder,
  isActive,
  toggleSort,
  label,
  variant,
}) => {
  return (
    <div
      className="group relative cursor-pointer rounded-5px border border-mb-dark-popover-item-border bg-mb-dark-popover-item **:transition-all"
      data-active={isActive}
      onClick={() => toggleSort?.(sortBy ?? "none")}
    >
      <div
        className={cn(
          "absolute top-1/2 left-0 h-full w-1 -translate-y-1/2 rounded-full bg-transparent",
          getVariantBtnBgClassName({ variant, isGroupHover: true }),
        )}
      />
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-5px bg-transparent pt-2.5 pr-4 pb-2.25 pl-8",
          getVariantBtnBg50ClassName({ variant, isGroupHover: true }),
        )}
      >
        <span className="text-15px font-normal select-none sm:text-xl">
          {label ?? sortBysLabels[sortBy ?? "none"]}
        </span>{" "}
        {isActive && (
          <DownTriangleIcon
            direction={sortOrder === "asc" ? "up" : "down"}
            size="small"
          />
        )}
      </div>
    </div>
  );
};

export default SortSelect;
