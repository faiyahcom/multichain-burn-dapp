import { IconDownTriangle } from "@/assets/react";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type ArrowDirection = "up" | "down" | "left" | "right";

export type ArrowSize = "normal" | "small";

type ArrowIconProps = HTMLAttributes<SVGElement> & {
  direction?: ArrowDirection;
  size?: ArrowSize;
};

const rotationMap: Record<ArrowDirection, string> = {
  right: "rotate-[270deg]",
  down: "rotate-0",
  left: "rotate-90",
  up: "rotate-180",
};

const sizeMap: Record<ArrowSize, string> = {
  normal: "w-[12px] h-[15px] sm:w-6 sm:h-[31px]",
  small: "w-[8px] h-[11px]",
};

export const DownTriangleIcon = ({
  direction = "down",
  size = "normal",
  className,
  ...props
}: ArrowIconProps) => {
  return (
    <IconDownTriangle
      aria-label={`arrow ${direction}`}
      className={cn(
        "shrink-0 transition-all",
        rotationMap[direction],
        sizeMap[size],
        className,
      )}
      {...props}
    />
  );
};
