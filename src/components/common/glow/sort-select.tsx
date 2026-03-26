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

interface Props {
  options?: SortBy[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  setSortBy?: (sortBy: SortBy | undefined) => void;
  setSortOrder?: (sortOrder: SortOrder) => void;
  placeholder?: string;
  defaultSortBy?: SortBy; // if set then it will be selected by default instead of none
  variant: ContainerVariant;
}

const SortSelect: React.FC<Props> = ({
  options,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  placeholder = "Sort by",
  defaultSortBy,
  variant,
}) => {
  const isActive = sortBy !== undefined && sortBy !== "none";

  // Cycle through No sort => Sort desc => Sort asc => No sort (or defaultSortBy)
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
      setSortBy?.(defaultSortBy);
      setSortOrder?.("desc");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={getButtonVariantFromContainerVariant({
            containerVariant: variant,
            isActive: false,
          })}
          size={"default"}
        >
          {isActive && <div className={cn("size-4")} />}
          {!isActive
            ? placeholder
            : (sortBysShortLabels[sortBy ?? "none"] ?? sortBy)}{" "}
          {isActive && (
            <DownTriangleIcon direction={sortOrder === "asc" ? "up" : "down"} />
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
          const isActive = sortByItem === sortBy;
          return (
            <OptionItem
              key={sortByItem}
              sortBy={sortByItem}
              sortOrder={sortOrder}
              isActive={isActive}
              toggleSort={handleToggleSort}
              label={sortBysLabels[sortByItem]}
              variant={variant}
            />
          );
        })}
      </PopoverContent>
    </Popover>
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
        <span className="text-15px font-normal sm:text-xl">
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
