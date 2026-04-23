import { cn } from "@/lib/utils";
import { useId } from "react";

const ContainerVariants = ["pair", "burn", "swap", "green", "stake"] as const;

export type ContainerVariant = (typeof ContainerVariants)[number];

export const getVariantBorderClassName = ({
  variant,
  custom,
}: {
  variant: ContainerVariant;
  custom?: string;
}) => {
  const className = "border-2 rounded-21px";

  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = "border-pair-border";
      break;
    case "burn":
      variantClassName = "border-burn-border";
      break;
    case "swap":
      variantClassName = "border-swap-border";
      break;
    case "green":
      variantClassName = "border-green-border";
      break;
    case "stake":
      variantClassName = "border-stake-border";
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(className, variantClassName, custom);
};

export const getVariantShadowClassName = ({
  variant,
  custom,
}: {
  variant: ContainerVariant;
  custom?: string;
}) => {
  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = "shadow-pair-glow";
      break;
    case "burn":
      variantClassName = "shadow-burn-glow";
      break;
    case "swap":
      variantClassName = "shadow-swap-glow";
      break;
    case "green":
      variantClassName = "shadow-green-glow";
      break;
    case "stake":
      variantClassName = "shadow-stake-glow";
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};

export const getVariantBgClassName = ({
  variant,
  custom,
}: {
  variant: ContainerVariant;
  custom?: string;
}) => {
  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = "card-pair-bg";
      break;
    case "burn":
      variantClassName = "card-burn-bg";
      break;
    case "swap":
      variantClassName = "card-swap-bg";
      break;
    case "green":
      variantClassName = "card-green-bg";
      break;
    case "stake":
      variantClassName = "card-stake-bg";
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};

export const getVariantBtnBg50ClassName = ({
  variant,
  custom,
  isHover,
  isGroupHover,
}: {
  variant: ContainerVariant;
  custom?: string;
  isHover?: boolean;
  isGroupHover?: boolean;
}) => {
  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = cn(
        { "bg-mb-btn-pair/50": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-pair/50": isHover },
        { "group-hover:bg-mb-btn-pair/50": isGroupHover },
      );
      break;
    case "burn":
      variantClassName = cn(
        { "bg-mb-btn-burn/50": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-burn/50": isHover },
        { "group-hover:bg-mb-btn-burn/50": isGroupHover },
      );
      break;
    case "swap":
      variantClassName = cn(
        { "bg-mb-btn-swap/50": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-swap/50": isHover },
        { "group-hover:bg-mb-btn-swap/50": isGroupHover },
      );
      break;
    case "green":
      variantClassName = cn(
        { "bg-mb-btn-green/50": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-green/50": isHover },
        { "group-hover:bg-mb-btn-green/50": isGroupHover },
      );
      break;
    case "stake":
      variantClassName = cn(
        { "bg-mb-btn-stake/50": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-stake/50": isHover },
        { "group-hover:bg-mb-btn-stake/50": isGroupHover },
      );
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};

export const getVariantBtnBg30ClassName = ({
  variant,
  custom,
  isHover,
  isGroupHover,
}: {
  variant: ContainerVariant;
  custom?: string;
  isHover?: boolean;
  isGroupHover?: boolean;
}) => {
  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = cn(
        { "bg-mb-btn-pair/30": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-pair/30": isHover },
        { "group-hover:bg-mb-btn-pair/30": isGroupHover },
      );
      break;
    case "burn":
      variantClassName = cn(
        { "bg-mb-btn-burn/30": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-burn/30": isHover },
        { "group-hover:bg-mb-btn-burn/30": isGroupHover },
      );
      break;
    case "swap":
      variantClassName = cn(
        { "bg-mb-btn-swap/30": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-swap/30": isHover },
        { "group-hover:bg-mb-btn-swap/30": isGroupHover },
      );
      break;
    case "green":
      variantClassName = cn(
        { "bg-mb-btn-green/30": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-green/30": isHover },
        { "group-hover:bg-mb-btn-green/30": isGroupHover },
      );
      break;
    case "stake":
      variantClassName = cn(
        { "bg-mb-btn-stake/30": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-stake/30": isHover },
        { "group-hover:bg-mb-btn-stake/30": isGroupHover },
      );
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};

export const getVariantBtnBgClassName = ({
  variant,
  custom,
  isHover,
  isGroupHover,
}: {
  variant: ContainerVariant;
  custom?: string;
  isHover?: boolean;
  isGroupHover?: boolean;
}) => {
  let variantClassName = "";
  switch (variant) {
    case "pair":
      variantClassName = cn(
        { "bg-mb-btn-pair": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-pair": isHover },
        { "group-hover:bg-mb-btn-pair": isGroupHover },
      );
      break;
    case "burn":
      variantClassName = cn(
        { "bg-mb-btn-burn": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-burn": isHover },
        { "group-hover:bg-mb-btn-burn": isGroupHover },
      );
      break;
    case "swap":
      variantClassName = cn(
        { "bg-mb-btn-swap": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-swap": isHover },
        { "group-hover:bg-mb-btn-swap": isGroupHover },
      );
      break;
    case "green":
      variantClassName = cn(
        { "bg-mb-btn-green": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-green": isHover },
        { "group-hover:bg-mb-btn-green": isGroupHover },
      );
      break;
    case "stake":
      variantClassName = cn(
        { "bg-mb-btn-stake": !isHover && !isGroupHover },
        { "hover:bg-mb-btn-stake": isHover },
        { "group-hover:bg-mb-btn-stake": isGroupHover },
      );
      break;
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};

const GlowContainer = ({
  variant,
  className,
  children,
  hasBorder = true,
  hasShadow = true,
  hasBg = true,
  onClick,
  id,
}: {
  variant: ContainerVariant;
  className?: string;
  children?: React.ReactNode;
  hasBorder?: boolean;
  hasShadow?: boolean;
  hasBg?: boolean;
  onClick?: () => void;
  id?: string;
}) => {
  const reactId = useId();
  const containerId = id ?? reactId;

  return (
    <div
      className={cn(
        hasBorder && getVariantBorderClassName({ variant }),
        hasShadow && getVariantShadowClassName({ variant }),
        hasBg && getVariantBgClassName({ variant }),
        className,
      )}
      onClick={onClick}
      id={containerId}
    >
      {children}
    </div>
  );
};

export default GlowContainer;
