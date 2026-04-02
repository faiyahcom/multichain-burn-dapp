import * as React from "react";
import { cn } from "@/lib/utils";
import { getVariantBorderClassName, type ContainerVariant } from "./container";

interface InputProps extends React.ComponentProps<"input"> {
  variant: ContainerVariant;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "focus:outline-none",
          getVariantBorderClassName({
            variant,
            custom: "rounded-md border-3",
          }),
          "bg-mb-glow-input-bg px-4 py-2 font-inter text-sm leading-none font-medium sm:text-xl",
          "placeholder:text-mb-glow-input-secondary read-only:text-mb-glow-input-secondary disabled:text-mb-glow-input-secondary",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
