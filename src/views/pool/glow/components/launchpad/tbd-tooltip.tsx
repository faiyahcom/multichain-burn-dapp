import { IconTooltipQuestion } from "@/assets/react";
import InfoTooltip from "@/components/common/glow/info-tooltip";

const TBDTooltip = () => {
  return (
    <div className="flex items-center justify-center gap-4">
      <span>TBD</span>
      <InfoTooltip
        variant="launchpad"
        content="Final amount will be determined at the end of the pool"
        customIcon={IconTooltipQuestion}
        classNames={{
          contentContainer: "max-w-132.75",
        }}
      />
    </div>
  );
};

export default TBDTooltip;
