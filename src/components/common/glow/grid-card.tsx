import { cn } from "@/lib/utils";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import type { ContainerVariant } from "./container";
import GlowContainer, {
  getVariantBorderClassName,
  getVariantBtnBgClassName,
} from "./container";

interface Props {
  variant: ContainerVariant;
  topSection: React.ReactNode;
  bottomSection: React.ReactNode;
  btn: React.ComponentProps<typeof Button>;
  classNames?: {
    container?: string;
    glowContainer?: string;
    content?: string;
  };
}

const CARD_VARIANT_BG_CLASS_NAME: Record<ContainerVariant, string> = {
  burn: "grid-burn-bg opacity-90",
  pair: "grid-pair-bg",
  swap: "grid-swap-bg",
  green: "",
  stake: "grid-stake-bg",
};

export const gridCardButtonClassName = ({
  variant,
  className,
}: {
  variant: ContainerVariant;
  className?: string;
}): string => {
  return cn(
    "mx-auto min-w-45 pb-2.75",
    getVariantBorderClassName({
      variant: variant,
      custom: "rounded-13px border",
    }),
    className,
  );
};

const GridCard: React.FC<Props> = ({
  variant,
  topSection,
  bottomSection,
  btn,
  classNames,
}) => {
  const { className: btnClassName, ...btnProps } = btn;

  return (
    <div className={cn("relative rounded-24px", classNames?.container)}>
      <GlowContainer
        variant={variant}
        className={cn(
          "relative h-full space-y-3 border-3 p-3 sm:space-y-6 sm:p-6",
          "text-center text-base font-semibold sm:text-2xl",
          "z-10 **:z-10",
          CARD_VARIANT_BG_CLASS_NAME[variant],
          classNames?.glowContainer,
        )}
        hasBg={false}
        hasShadow={false}
      >
        {variant === "stake" && (
          <div className="absolute! inset-0 z-0! h-full w-full bg-black opacity-20" />
        )}
        <div className={cn("space-y-2.25 sm:space-y-4.5", classNames?.content)}>
          {topSection}
          <div
            className={cn(
              "h-0.75 w-full",
              getVariantBtnBgClassName({ variant }),
            )}
          />
          {bottomSection}
        </div>
        <Button
          variant={getButtonVariantFromContainerVariant({
            containerVariant: variant,
            isGrid: true,
          })}
          className={cn(
            "relative",
            gridCardButtonClassName({
              variant,
              className: btnClassName,
            }),
          )}
          hasHover
          {...btnProps}
        >
          {btn.children}
        </Button>
      </GlowContainer>
    </div>
  );
};

export default GridCard;
