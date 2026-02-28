import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
  content?: string;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  sideOffset?: React.ComponentProps<typeof TooltipContent>["sideOffset"];
  classNames?: {
    icon?: string;
  };
}

const InfoTooltip: React.FC<Props> = ({
  content,
  side = "bottom",
  sideOffset = 10,
  classNames,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
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
        className="max-w-101.25 rounded-5px bg-mb-popover p-3 pt-2.75 popover-shadow"
        sideOffset={sideOffset}
        side={side}
      >
        <div className="rounded-5px bg-primary-foreground pt-3.25 pr-2.75 pb-5.5 pl-2.25">
          <p className="text-15px font-normal text-foreground">{content}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default InfoTooltip;
