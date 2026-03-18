import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface Props {
  isLoading?: boolean;
  classNames?: {
    container?: string;
  };
}

const CenterSpinner: React.FC<Props> = ({ isLoading, classNames }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center py-1",
        classNames?.container,
      )}
    >
      <Spinner />
    </div>
  );
};

export default CenterSpinner;
