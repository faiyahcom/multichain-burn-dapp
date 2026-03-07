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
} from "../ui/popover";
import { Button } from "../ui/button";
import { ArrowIcon } from "./arrow-icon";
import { IconArrowDownWithStem } from "@/assets/react";
import { cn } from "@/lib/utils";
import { ArrowDownIcon } from "lucide-react";

interface Props {
    options?: SortBy[];
    sortBy?: SortBy;
    sortOrder?: SortOrder;
    setSortBy?: (sortBy: SortBy | undefined) => void;
    setSortOrder?: (sortOrder: SortOrder) => void;
    placeholder?: string;
    labels?: Record<string, string>;
    shortLabels?: Record<string, string>;
}

const SortSelect: React.FC<Props> = ({
    options,
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    placeholder = "Sort by",
    labels,
    shortLabels,
}) => {
    const isActive = sortBy !== undefined && sortBy !== "none";

    // Cycle through No sort (none) => Sort desc => Sort asc => No sort
    const handleToggleSort = (inputSortBy: SortBy) => {
        if (inputSortBy === "none") {
            return;
        }
        if (sortBy === "none") {
            setSortBy?.(inputSortBy);
            setSortOrder?.("desc");
            return;
        }
        if (sortBy === inputSortBy) {
            if (sortOrder === "desc") {
                setSortOrder?.("asc");
            } else {
                setSortBy?.(undefined);
                setSortOrder?.("desc");
            }
        } else {
            setSortBy?.(inputSortBy);
            setSortOrder?.("desc");
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={!isActive ? "mb-inactive" : "mb-active"}
                    size={"mb-btn"}
                >
                    <div className={cn("size-2.5", { "size-4": isActive })} />
                    {!isActive ? placeholder : (shortLabels?.[sortBy ?? "none"] ?? sortBysShortLabels[sortBy ?? "none"])}{" "}
                    {!isActive ? (
                        <ArrowIcon direction="down" />
                    ) : (
                        <ArrowDownIcon
                            className={cn("size-4 transition-transform", {
                                "rotate-180": sortOrder === "asc",
                            })}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="space-y-1 overflow-y-auto"
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
                            label={labels?.[sortByItem]}
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
}

const OptionItem: React.FC<OptionItemProps> = ({
    sortBy,
    sortOrder,
    isActive,
    toggleSort,
    label,
}) => {
    return (
        <div
            className="group relative cursor-pointer rounded-5px bg-primary-foreground px-1 py-0.5 **:transition-all"
            data-active={isActive}
            onClick={() => toggleSort?.(sortBy ?? "none")}
        >
            <div className="absolute top-1/2 left-0 h-9.5 w-1.75 -translate-y-1/2 rounded-full bg-transparent group-hover:bg-active" />
            <div className="flex items-center gap-4 rounded-5px bg-transparent pt-2.5 pb-2.25 pl-9.75 group-hover:bg-inactive">
                <span className="text-15px font-normal">
                    {label ?? sortBysLabels[sortBy ?? "none"]}
                </span>{" "}
                {isActive && (
                    <IconArrowDownWithStem
                        className={cn({ "rotate-180": sortOrder === "asc" })}
                    />
                )}
            </div>
        </div>
    );
};

export default SortSelect;
