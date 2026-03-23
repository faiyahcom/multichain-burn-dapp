import { cn } from "@/lib/utils";

const variantClass = {
  pair: "card-pair-glow",
  burn: "card-burn-glow",
  swap: "card-swap-glow",
} as const;

type GlowVariant = keyof typeof variantClass;

interface GlowContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: GlowVariant;
}

export function GlowContainer({
  variant,
  className,
  children,
  ...props
}: GlowContainerProps) {
  return (
    <div className={cn(variantClass[variant], className)} {...props}>
      {children}
    </div>
  );
}
