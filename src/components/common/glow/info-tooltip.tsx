import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconTooltipInfo } from "@/assets/react";
import {
  getVariantBorderClassName,
  getVariantShadowClassName,
  type ContainerVariant,
} from "./container";

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
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <IconTooltipInfo className={cn("inline-flex", classNames?.icon)} />
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          getVariantBorderClassName({ variant }),
          getVariantShadowClassName({ variant }),
          "max-w-101.25 rounded-5px bg-mb-dark-popover p-2",
          classNames?.contentContainer,
        )}
        sideOffset={sideOffset}
        side={side}
      >
        <div
          className={cn(
            "h-fit rounded-5px border-mb-dark-popover-item-border bg-mb-dark-popover-item px-3 py-2 font-inter",
            classNames?.textContainer,
          )}
        >
          <p
            className={cn(
              "text-15px font-normal text-foreground",
              classNames?.text,
            )}
          >
            {content}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTooltip;
