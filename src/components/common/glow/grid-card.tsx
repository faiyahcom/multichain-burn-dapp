import { cn } from "@/lib/utils";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import type { ContainerVariant } from "./container";
import GlowContainer, {
  getVariantBorderClassName,
  getVariantBtnBgClassName,
  getVariantShadowClassName,
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

const CARD_VARIANT_BG_IMG: Record<ContainerVariant, string> = {
  burn: "/images/grid/burn-card-bg.png",
  pair: "/images/grid/pair-card-bg.png",
  swap: "/images/grid/swap-card-bg.png",
};

const CARD_VARIANT_BG_CLASS_NAME: Record<ContainerVariant, string> = {
  burn: "grid-burn-bg",
  pair: "grid-pair-bg",
  swap: "grid-swap-bg",
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
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-24px bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${CARD_VARIANT_BG_IMG[variant]})` }}
      />
      <GlowContainer
        variant={variant}
        className={cn(
          "relative space-y-3 border-3 p-3 sm:space-y-6 sm:p-6",
          "text-center text-base font-semibold sm:text-2xl",
          "z-10 **:z-10",
          CARD_VARIANT_BG_CLASS_NAME[variant],
          classNames?.glowContainer,
        )}
        hasShadow={false}
      >
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
            "mx-auto min-w-45 pb-2.75",
            variant === "pair" &&
              getVariantShadowClassName({ variant: "swap" }), // Exception for pair card
            getVariantBorderClassName({
              variant,
              custom: "rounded-13px border",
            }),
            btnClassName,
          )}
          {...btnProps}
        >
          {btn.children}
        </Button>
      </GlowContainer>
    </div>
  );
};

export default GridCard;
