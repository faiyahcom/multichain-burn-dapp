import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { getVariantShadowClassName, type ContainerVariant } from "./container";

const buttonVariants = ({
  hasHover = false,
  hasGroupHover = false,
}: {
  hasHover?: boolean;
  hasGroupHover?: boolean;
}) =>
  cva(
    "transition-all duration-300 inline-flex items-center justify-center gap-2 md:gap-3 rounded-md",
    {
      variants: {
        variant: {
          default: "",
          pair: cn(
            "bg-mb-btn-pair text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-pair": hasHover },
            {
              "group-hover:bg-foreground group-hover:text-mb-btn-pair":
                hasGroupHover,
            },
            getVariantShadowClassName({ variant: "pair" }),
          ),
          burn: cn(
            "bg-mb-btn-burn text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-burn": hasHover },
            {
              "group-hover:bg-foreground group-hover:text-mb-btn-burn":
                hasGroupHover,
            },
            getVariantShadowClassName({ variant: "burn" }),
          ),
          swap: cn(
            "bg-mb-btn-swap text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-swap": hasHover },
            {
              "group-hover:bg-foreground group-hover:text-mb-btn-swap":
                hasGroupHover,
            },
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
          default: "py-3 px-6 text-base md:text-2xl",
          big: "py-[25px] px-[66px] text-22px",
          pagination:
            "py-[6px] px-8 rounded-13px text-base sm:text-2xl font-semibold",
          "pagination-small":
            "py-[6px] px-[19px] rounded-13px text-base sm:text-2xl font-semibold",
        },
      },
      defaultVariants: {
        variant: "default",
        size: "default",
      },
    },
  );

export type ButtonVariant = NonNullable<
  VariantProps<ReturnType<typeof buttonVariants>>["variant"]
>;

const BUTTON_VARIANT_CONTAINER_VARIANT_MAP: Record<
  ButtonVariant,
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
}): ButtonVariant => {
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
  hasGroupHover = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<ReturnType<typeof buttonVariants>> & {
    hasHover?: boolean;
    hasGroupHover?: boolean;
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({ hasHover, hasGroupHover })({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };
