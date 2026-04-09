import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface Props {
  active?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  classNames?: {
    btn?: string;
  };
  isLoading?: boolean;
  disabled?: boolean;
}

const BlueSwitch: React.FC<Props> = ({
  active,
  onClick,
  classNames,
  isLoading,
  disabled,
}) => {
  return (
    <button
      className={cn(
        "flex h-8.25 w-15 items-center justify-start rounded-full border border-mb-switch-blue bg-primary-foreground p-0.5 transition-all duration-300",
        "relative overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:bg-transparent after:transition-colors after:duration-300",
        { "after:bg-mb-switch-inactive/35": !active },
        { "justify-end": active },
        classNames?.btn,
      )}
      onClick={(e) => onClick?.(e)}
      disabled={disabled || isLoading}
    >
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full bg-inactive transition-colors duration-300",
          { "bg-primary-foreground": !active },
        )}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-mb-switch-blue">
            <div className="size-2 shrink-0 rounded-full bg-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};

export default BlueSwitch;
