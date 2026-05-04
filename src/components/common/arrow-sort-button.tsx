import { cn } from "@/lib/utils";
import type { SortBy, SortOrder } from "@/types/common";
import { ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";

interface Props {
  isActive?: boolean;
  sortOrder?: SortOrder;
  sortBy?: SortBy;
  onToggleSort?: ({
    sortBy,
    sortOrder,
  }: {
    sortBy: SortBy;
    sortOrder: SortOrder;
  }) => void;
}

const ArrowSortButton: React.FC<Props> = ({
  isActive,
  sortOrder,
  sortBy,
  onToggleSort,
}) => {
  const handleToggleSort = () => {
    if (!onToggleSort || !sortBy) return;
    if (!isActive) {
      onToggleSort({ sortBy, sortOrder: "desc" });
    } else {
      if (sortOrder === "desc") {
        onToggleSort({ sortBy, sortOrder: "asc" });
      } else {
        onToggleSort({ sortBy, sortOrder: "desc" });
      }
    }
  };

  return (
    <button className="shrink-0" onClick={handleToggleSort}>
      {isActive ? (
        <ArrowDownIcon
          className={cn("text-active transition-transform duration-300", {
            "rotate-180": sortOrder === "asc",
          })}
        />
      ) : (
        <ArrowUpDownIcon />
      )}
    </button>
  );
};

export default ArrowSortButton;
