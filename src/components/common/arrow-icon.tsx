import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ArrowDirection = "up" | "down" | "left" | "right";

type ArrowIconProps = HTMLAttributes<HTMLSpanElement> & {
  direction?: ArrowDirection;
};

const rotationMap: Record<ArrowDirection, string> = {
  right: "rotate-0",
  down: "rotate-90",
  left: "rotate-180",
  up: "rotate-[270deg]",
};

export function ArrowIcon({
  direction = "right",
  className,
  ...props
}: ArrowIconProps) {
  return (
    <span
      aria-label={`arrow ${direction}`}
      className={cn("font-medium leading-6 text-base", rotationMap[direction], className)}
      {...props}
    >
      {'>'}
    </span>
  );
}
