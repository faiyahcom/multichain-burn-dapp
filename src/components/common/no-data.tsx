import { cn } from "@/lib/utils";

interface Props {
  text?: string;
  data?: unknown[];
  isLoading?: boolean;
  classNames?: {
    container?: string;
    text?: string;
  };
}

const NoData: React.FC<Props> = ({
  text = "No data found",
  data,
  isLoading,
  classNames,
}) => {
  if (isLoading) return null;
  if (!!data && data.length > 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center py-6",
        classNames?.container,
      )}
    >
      <em className={cn("text-secondary-text", classNames?.text)}>{text}</em>
    </div>
  );
};

export default NoData;
