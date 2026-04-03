import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
}

const InfoTooltip: React.FC<Props> = ({
  content,
  side = "bottom",
  sideOffset = 10,
  classNames,
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
        <span
          className={cn(
            "inline-flex size-5.25 shrink-0 items-center justify-center rounded-full bg-foreground pt-0.5 text-base leading-0 font-bold text-primary-foreground",
            classNames?.icon,
          )}
        >
          i
        </span>
      </TooltipTrigger>
      <TooltipContent
        className={cn(
          "max-w-101.25 rounded-5px bg-mb-popover p-3 pt-2.75 popover-shadow",
          classNames?.contentContainer,
        )}
        sideOffset={sideOffset}
        side={side}
      >
        <div className={cn(
          "rounded-5px bg-primary-foreground py-3.25 pr-2.75 pl-2.25 min-h-20.25",
          classNames?.textContainer,
        )}>
          <p className={cn("text-15px font-normal text-foreground", classNames?.text)}>{content}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTooltip;
