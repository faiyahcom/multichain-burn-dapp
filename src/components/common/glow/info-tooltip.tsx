import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { IconTooltipInfo } from "@/assets/react";
import { getVariantBorderClassName, getVariantShadowClassName, type ContainerVariant } from "./container";

interface Props {
  content?: string;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  sideOffset?: React.ComponentProps<typeof TooltipContent>["sideOffset"];
  classNames?: {
    icon?: string;
    contentContainer?: string;
    textContainer?: string;
    text?: string;
  };
  variant?: ContainerVariant;
}

const InfoTooltip: React.FC<Props> = ({
  content,
  side = "bottom",
  sideOffset = 20,
  classNames,
  variant = "pair",
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconTooltipInfo className={cn("inline-flex", classNames?.icon)} />
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          getVariantBorderClassName({variant}),
          getVariantShadowClassName({variant}),
          "max-w-101.25 bg-mb-dark-popover p-2 rounded-5px",
          classNames?.contentContainer,
        )}
        sideOffset={sideOffset}
        side={side}
      >
        <div className={cn(
          "rounded-5px bg-mb-dark-popover-item border-mb-dark-popover-item-border py-2 px-3 h-fit",
          classNames?.textContainer,
        )}>
          <p className={cn("text-15px font-normal text-foreground", classNames?.text)}>{content}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTooltip;
