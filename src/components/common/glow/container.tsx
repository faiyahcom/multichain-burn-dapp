import { cn } from "@/lib/utils";

const ContainerVariants = ["pair", "burn", "swap"] as const;

type ContainerVariant = (typeof ContainerVariants)[number];

export const getVariantBorderClassName = ({
  variant,
  custom,
}: {
  variant: ContainerVariant;
  custom?: string;
}) => {
  const className = "border-4 rounded-21px";

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
    default:
      const _exhaustiveCheck: never = variant;
      variantClassName = _exhaustiveCheck;
      break;
  }

  return cn(variantClassName, custom);
};
