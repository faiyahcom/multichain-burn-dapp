import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/common/glow/button";

type ButtonProps = React.ComponentProps<typeof Button>;

function withPoolStatus<T extends ButtonProps>(
  WrappedButton: React.ComponentType<T>,
) {
  function PoolStatusDisplay({ className, ...props }: T) {
    return (
      <WrappedButton
        className={cn(
          "cursor-default text-2xl font-medium font-orbitron",
          className,
        )}
        {...(props as T)}
      />
    );
  }
  PoolStatusDisplay.displayName = `PoolStatus(${WrappedButton.displayName ?? WrappedButton.name})`;
  return PoolStatusDisplay;
}

const PoolStatusDisplay = withPoolStatus(Button);

function withVariant<T extends ButtonProps>(
  WrappedButton: React.ComponentType<T>,
  variant: ButtonProps["variant"],
) {
  function VariantPoolStatus(props: Omit<T, "variant">) {
    return <WrappedButton variant={variant} {...(props as T)} />;
  }
  VariantPoolStatus.displayName = `VariantPoolStatus(${WrappedButton.displayName ?? WrappedButton.name})`;
  return VariantPoolStatus;
}

const SwapPoolStatusDisplay = withVariant(PoolStatusDisplay, "swap");
const BurnPoolStatusDisplay = withVariant(PoolStatusDisplay, "burn");

export {
  PoolStatusDisplay,
  withPoolStatus,
  withVariant,
  SwapPoolStatusDisplay,
  BurnPoolStatusDisplay,
};
