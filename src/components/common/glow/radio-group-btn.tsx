import { cn } from "@/lib/utils";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import type { ContainerVariant } from "./container";

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
  variant: ContainerVariant;
}

const RadioGroupButton: React.FC<Props> = ({
  options,
  selected,
  onChange,
  classNames,
  variant,
}) => {
  return (
    <div className={cn("flex items-center gap-2.5", classNames?.container)}>
      {options?.map((option, index) => {
        return (
          <Button
            key={index}
            variant={getButtonVariantFromContainerVariant({
              containerVariant: variant,
              isActive: selected === option.value,
            })}
            size={"default"}
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
