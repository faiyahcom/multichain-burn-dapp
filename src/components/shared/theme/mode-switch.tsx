import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Sun, Moon } from "lucide-react";

import { cn } from "@/lib/utils";

function Switch({
    className,
    size = "default",
    ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
    size?: "sm" | "default";
}) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            data-size={size}
            className={cn(
                "group relative inline-flex shrink-0 items-center rounded-full transition-colors outline-none",
                "bg-inactive",
                "focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                size === "default" && "h-6 w-14",
                size === "sm" && "h-5 w-11",
                className,
            )}
            {...props}
        >
            {/* Icons container */}
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-between pr-1 pl-1.5">
                <Sun
                    className={cn(
                        "text-xs transition-colors",
                        "text-black",
                        size === "default" ? "size-4" : "size-3",
                    )}
                />
                <Moon
                    className={cn(
                        "text-xs transition-colors",
                        "group-data-[state=checked]:text-greyed",
                        "text-black",
                        size === "default" ? "size-4" : "size-3",
                    )}
                />
            </div>

            {/* Thumb */}
            <SwitchPrimitive.Thumb
                className={cn(
                    "z-10 block rounded-full bg-sub-bg shadow-md transition-transform",
                    size === "default" && "h-5 w-5",
                    size === "sm" && "h-4 w-4",
                    "translate-x-1",
                    "data-[state=checked]:translate-x-[calc(100%+0.875rem)]",
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
