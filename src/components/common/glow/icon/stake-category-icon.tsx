import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const StakeCategoryIcon: React.FC<Props> = ({ className }) => {
  return (
    <div className={cn("relative", className)}>
      <img
        src="/images/categories/stake-glow.png"
        alt="stake glow icon"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-190"
      />
    </div>
  );
};

export default StakeCategoryIcon;
