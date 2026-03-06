import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export interface RadioGroupButtonOption {
  label: string;
  value: string;
}

interface Props {
  options?: RadioGroupButtonOption[];
  selected?: string;
  onChange?: (value: string) => void;
  classNames?: {
    container?: string;
    btn?: string;
  };
}

const RadioGroupButton: React.FC<Props> = ({
  options,
  selected,
  onChange,
  classNames,
}) => {
  return (
    <div className={cn("flex items-center gap-2.5", classNames?.container)}>
      {options?.map((option, index) => {
        return (
          <Button
            key={index}
            variant={selected === option.value ? "mb-active" : "mb-inactive"}
            size={"mb-btn"}
            onClick={() => onChange?.(option.value)}
            className={classNames?.btn}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default RadioGroupButton;
