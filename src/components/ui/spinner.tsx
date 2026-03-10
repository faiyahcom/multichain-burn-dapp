import { IconSpinner } from "@/assets/react";
import { cn } from "@/lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <IconSpinner
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin text-active", className)}
      {...props}
    />
  );
}

export { Spinner };
