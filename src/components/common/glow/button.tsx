import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";
import { getVariantShadowClassName, type ContainerVariant } from "./container";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = ({
  hasHover = false,
  hasGroupHover = false,
}: {
  hasHover?: boolean;
  hasGroupHover?: boolean;
}) =>
  cva(
    "transition-all duration-300 inline-flex items-center justify-center gap-2 md:gap-3 rounded-md disabled:opacity-50 font-semibold",
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
          "pair-grid": cn(
            "bg-mb-btn-pair text-foreground grid-pair-btn-bg",
            getVariantShadowClassName({ variant: "pair" }),
            {
              "hover:bg-foreground hover:bg-none hover:text-mb-btn-pair":
                hasHover,
            },
            {
              "group-hover:bg-foreground group-hover:bg-none group-hover:text-mb-btn-pair":
                hasGroupHover,
            },
          ),
          "burn-grid": cn(
            "bg-mb-btn-burn text-foreground grid-burn-btn-bg",
            getVariantShadowClassName({ variant: "burn" }),
            {
              "hover:bg-foreground hover:bg-none hover:text-mb-btn-burn":
                hasHover,
            },
            {
              "group-hover:bg-foreground group-hover:bg-none group-hover:text-mb-btn-burn":
                hasGroupHover,
            },
          ),
          "swap-grid": cn(
            "bg-mb-btn-swap text-foreground grid-swap-btn-bg",
            getVariantShadowClassName({ variant: "swap" }),
            {
              "hover:bg-foreground hover:bg-none hover:text-mb-btn-swap":
                hasHover,
            },
            {
              "group-hover:bg-foreground group-hover:bg-none group-hover:text-mb-btn-swap":
                hasGroupHover,
            },
          ),
          green: "", // left for type safety
          stake: cn(
            "bg-mb-btn-stake text-foreground",
            { "hover:bg-foreground hover:text-mb-btn-stake": hasHover },
            {
              "group-hover:bg-foreground group-hover:text-mb-btn-stake":
                hasGroupHover,
            },
            getVariantShadowClassName({ variant: "stake" }),
          ),
          "stake-active": cn(
            "bg-foreground text-mb-btn-stake",
            getVariantShadowClassName({ variant: "stake" }),
          ),
          "stake-grid": cn(
            "bg-mb-btn-stake text-foreground grid-stake-btn-bg",
            getVariantShadowClassName({ variant: "stake" }),
            {
              "hover:bg-foreground hover:bg-none hover:text-mb-btn-stake":
                hasHover,
            },
            {
              "group-hover:bg-foreground group-hover:bg-none group-hover:text-mb-btn-stake":
                hasGroupHover,
            },
          ),
        },
        size: {
          default: "py-3 px-6 text-base md:text-2xl",
          big: "py-6.25 px-16.5 text-22px",
          pagination:
            "py-1.5 px-8 rounded-13px text-base sm:text-2xl font-semibold",
          "pagination-small":
            "py-1.5 px-4.75 rounded-13px text-base sm:text-2xl font-semibold",
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
  "pair-grid": "pair",
  "burn-grid": "burn",
  "swap-grid": "swap",
  green: "green",
  stake: "stake",
  "stake-active": "stake",
  "stake-grid": "stake",
};

// Mutually exclusive: can pass isActive OR isGrid, but not both
type ButtonVariantOptions =
  | { containerVariant: ContainerVariant; isActive?: boolean; isGrid?: never }
  | { containerVariant: ContainerVariant; isGrid?: boolean; isActive?: never };

export const getButtonVariantFromContainerVariant = ({
  containerVariant,
  isActive,
  isGrid,
}: ButtonVariantOptions): ButtonVariant => {
  const entry = Object.entries(BUTTON_VARIANT_CONTAINER_VARIANT_MAP).find(
    ([key, value]) => {
      if (value !== containerVariant) return false;
      if (isGrid) return key.endsWith("-grid");
      if (isActive) return key.endsWith("-active");
      return !key.endsWith("-active") && !key.endsWith("-grid");
    },
  );

  return (entry?.[0] ?? "default") as ButtonVariant;
};

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  hasHover = false,
  hasGroupHover = false,
  disabled,
  isLoading,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<ReturnType<typeof buttonVariants>> & {
    hasHover?: boolean;
    hasGroupHover?: boolean;
    asChild?: boolean;
    isLoading?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  const isDisabled = disabled || isLoading;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({
          hasHover: hasHover && !isDisabled,
          hasGroupHover: hasGroupHover && !isDisabled,
        })({
          variant,
          size,
          className,
        }),
      )}
      disabled={isDisabled}
      {...props}
    >
      {asChild ? (
        // Slot.Root requires a single child — clone it and inject the spinner alongside its children
        React.isValidElement(children) ? (
          React.cloneElement(
            children,
            {} as object,
            <>
              {isLoading && <Spinner />}
              {
                (children as React.ReactElement<{ children?: React.ReactNode }>)
                  .props.children
              }
            </>,
          )
        ) : // if children is not a ReactElement, then render the only the spinner if isLoading
        isLoading ? (
          <Spinner />
        ) : (
          children
        )
      ) : (
        <>
          {isLoading && <Spinner />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
