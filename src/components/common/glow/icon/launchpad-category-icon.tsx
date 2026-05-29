import { IconLaunchpad } from "@/assets/react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const LaunchpadCategoryIcon: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={cn(
        "relative flex size-10.5 shrink-0 items-center justify-center",
        className,
      )}
    >
      <div
        className="absolute top-1/2 left-1/2 size-px -translate-x-1/2 -translate-y-1/2"
        style={{
          boxShadow: "0px 0px 20px 5px rgba(2, 133, 255, 0.878431)",
        }}
      />
      <IconLaunchpad className="z-10 size-[71.43%]" />
    </div>
  );
};

export default LaunchpadCategoryIcon;
