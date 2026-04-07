import { cn } from "@/lib/utils";
import type { ContainerVariant } from "./container";
import GlowContainer from "./container";

interface Props {
  title: string;
  value: string;
  valueTitle?: string; // Optional if the value is too long
  variant: ContainerVariant;
  classNames?: {
    container?: string;
    glowContainer?: string;
  };
}

const CARD_VARIANT_BG_IMG: Record<ContainerVariant, string> = {
  burn: "/images/summary/burn-card-bg.png",
  pair: "/images/summary/pair-card-bg.png",
  swap: "/images/summary/swap-card-bg.png",
  green: "",
};

const CARD_VARIANT_BG: Record<ContainerVariant, string> = {
  burn: "card-burn-bold-bottom-bg",
  pair: "card-pair-bold-bottom-bg",
  swap: "card-swap-bold-bottom-bg",
  green: "",
};

const GlowSummaryCard: React.FC<Props> = ({
  title,
  value,
  valueTitle,
  variant,
  classNames,
}) => {
  return (
    <div className={cn("relative rounded-24px", classNames?.container)}>
      {CARD_VARIANT_BG_IMG[variant] && (
        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-24px bg-cover bg-center bg-no-repeat opacity-30"
          style={{ backgroundImage: `url(${CARD_VARIANT_BG_IMG[variant]})` }}
        />
      )}
      <GlowContainer
        variant={variant}
        className={cn(
          "relative h-full rounded-24px px-3 pt-5.75 pb-9.5 md:px-6 md:pt-11.5 md:pb-19",
          "flex flex-col justify-between gap-4 md:gap-8.25",
          "z-10 text-right font-semibold **:z-10",
          CARD_VARIANT_BG[variant],
          classNames?.glowContainer,
        )}
      >
        <p className="text-2xl md:text-28px">{title}</p>
        <p
          className="max-w-full min-w-0 truncate text-28px md:text-3xl"
          title={valueTitle ?? value}
        >
          {value}
        </p>
      </GlowContainer>
    </div>
  );
};

export default GlowSummaryCard;
