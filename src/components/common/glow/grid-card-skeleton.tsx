import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Props {
  count?: number;
  isLoading?: boolean;
  classNames?: {
    container?: string;
    skeleton?: string;
  };
}

const GridCardSkeleton: React.FC<Props> = ({
  count = 1,
  isLoading,
  classNames,
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn("global-grid", classNames?.container)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          className={cn("aspect-square rounded-24px", classNames?.skeleton)}
          key={index}
        />
      ))}
    </div>
  );
};

export default GridCardSkeleton;
