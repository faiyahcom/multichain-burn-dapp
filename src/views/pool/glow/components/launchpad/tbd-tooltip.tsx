import { IconTooltipQuestion } from "@/assets/react";
import InfoTooltip from "@/components/common/glow/info-tooltip";
import { cn } from "@/lib/utils";
import { type Props as TooltipProps } from "@/components/common/glow/info-tooltip";

const TBDTooltip = ({
  classNames,
  tooltipProps,
}: {
  classNames?: {
    container?: string;
    text?: string;
  };
  tooltipProps?: TooltipProps;
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        classNames?.container,
      )}
    >
      <span>TBD</span>
      <InfoTooltip
        variant="launchpad"
        content="Final amount will be determined at the end of the pool"
        customIcon={IconTooltipQuestion}
        {...tooltipProps}
        classNames={{
          contentContainer: "max-w-132.75",
          ...tooltipProps?.classNames,
        }}
      />
    </div>
  );
};

export default TBDTooltip;
