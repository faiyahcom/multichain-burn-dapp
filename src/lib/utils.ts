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
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customMerge(clsx(inputs));
}
