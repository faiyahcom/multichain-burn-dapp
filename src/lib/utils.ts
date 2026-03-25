import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-tiny",
        "text-xs",
        "text-sm",
        "text-base",
        "text-md",
        "text-lg",
        "text-xl",
        "text-2xl",
        "text-3xl",
        "text-15px",
        "text-11px",
        "text-40px",
        "text-13px",
        "text-28px",
        "text-22px",
      ],
      rounded: [
        "rounded-sm",
        "rounded-md",
        "rounded-md-plus",
        "rounded-lg",
        "rounded-xl",
        "rounded-5px",
        "rounded-17px",
        "rounded-14px",
        "rounded-2px",
        "rounded-3px",
        "rounded-21px",
        "rounded-18px",
        "rounded-24px",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customMerge(clsx(inputs));
}
