import { cn } from "@/lib/utils";

interface FContainerProps {
  children?: React.ReactNode;
  className?: string;
}

export const FContainer: React.FC<FContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-sm border border-mb-gray-e47 bg-primary-foreground",
        className,
      )}
      style={{
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
      }}
    >
      {children}
    </div>
  );
};

interface FSummarySectionProps {
  currentNumber?: number;
  totalNumber?: number;
  unit?: string;
  unitPlural?: string;
}

export const FSummarySection: React.FC<FSummarySectionProps> = ({
  currentNumber = 0,
  totalNumber = 0,
  unit = "item",
  unitPlural,
}) => {
  const displayUnit = totalNumber > 1 ? (unitPlural ?? `${unit}s`) : unit;

  return (
    <div className="bg-mb-gray-fa px-3 py-2 sm:px-6 sm:py-4">
      <p>
        Showing {currentNumber} of {totalNumber} {displayUnit}
      </p>
    </div>
  );
};
