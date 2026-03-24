import { cn } from "@/lib/utils";

const ContainerVariants = ["pair", "burn", "swap"] as const;

type ContainerVariant = (typeof ContainerVariants)[number];

export const getContainerBorderClassName = ({
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
      break;
  }

  return cn(className, variantClassName, custom);
};
