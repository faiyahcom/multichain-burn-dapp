import { cn } from "@/lib/utils";

export const contentClassName = (customClassName?: string) =>
  cn("min-w-56 rounded-lg border-transparent", customClassName);

export const itemClassName = ({ isSelected }: { isSelected: boolean }) =>
  cn(
    "flex cursor-pointer items-center gap-3 rounded-5px px-4 py-2",
    "transition-colors duration-300",
    "border border-mb-dark-popover-item-border bg-mb-dark-popover-item",
    "hover:border-transparent hover:bg-mb-btn-swap/50",
    { "border-transparent bg-mb-btn-swap/50": isSelected },
  );

export const leftSelectedPanelClassName = ({
  isSelected,
}: {
  isSelected: boolean;
}) =>
  cn("duration-300 group-hover:bg-mb-btn-swap", {
    "bg-mb-btn-swap": isSelected,
  });
