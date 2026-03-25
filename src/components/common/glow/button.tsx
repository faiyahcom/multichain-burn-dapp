import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { getVariantShadowClassName, type ContainerVariant } from "./container";

const buttonVariants = ({ hasHover = false }: { hasHover?: boolean }) =>
  cva(
    "transition-all duration-300 inline-flex items-center justify-center gap-2 md:gap-3 rounded-md",
    {
      variants: {
        variant: {
          default: "",
          pair: cn(
            "bg-mb-btn-pair text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-pair": hasHover },
            getVariantShadowClassName({ variant: "pair" }),
          ),
          burn: cn(
            "bg-mb-btn-burn text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-burn": hasHover },
            getVariantShadowClassName({ variant: "burn" }),
          ),
          swap: cn(
            "bg-mb-btn-swap text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-swap": hasHover },
            getVariantShadowClassName({ variant: "swap" }),
          ),
          "pair-active": cn(
            "bg-foreground text-mb-btn-pair",
            getVariantShadowClassName({ variant: "pair" }),
          ),
          "burn-active": cn(
            "bg-foreground text-mb-btn-burn",
            getVariantShadowClassName({ variant: "burn" }),
          ),
          "swap-active": cn(
            "bg-foreground text-mb-btn-swap",
            getVariantShadowClassName({ variant: "swap" }),
          ),
        },
        size: {
          default: "py-3 px-6 text-xl md:text-2xl",
          big: "py-[25px] px-[66px] text-22px",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );

const BUTTON_VARIANT_CONTAINER_VARIANT_MAP: Record<
  NonNullable<VariantProps<ReturnType<typeof buttonVariants>>["variant"]>,
  ContainerVariant | undefined
> = {
  default: undefined,
  burn: "burn",
  pair: "pair",
  swap: "swap",
  "burn-active": "burn",
  "pair-active": "pair",
  "swap-active": "swap",
};

export const getButtonVariantFromContainerVariant = ({
  containerVariant,
  isActive,
}: {
  containerVariant: ContainerVariant;
  isActive: boolean;
}): NonNullable<VariantProps<ReturnType<typeof buttonVariants>>["variant"]> => {
  const entry = Object.entries(BUTTON_VARIANT_CONTAINER_VARIANT_MAP).find(
    ([key, value]) =>
      value === containerVariant && isActive === key.endsWith("-active"),
  );

  return (entry?.[0] ?? "default") as NonNullable<
    VariantProps<ReturnType<typeof buttonVariants>>["variant"]
  >;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  hasHover = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<ReturnType<typeof buttonVariants>> & {
    hasHover?: boolean;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ hasHover })({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
