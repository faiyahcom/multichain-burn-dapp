import {
  listLayouts,
  listLayoutsBtnIcons,
  type ListLayout,
} from "@/types/common";
// import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Button, getButtonVariantFromContainerVariant } from "./button";
import type { ContainerVariant } from "./container";

interface Props {
  layout?: ListLayout;
  setLayout?: (layout: ListLayout) => void;
  hasContainer?: boolean;
  classNames?: {
    container?: string;
    btn?: string;
  };
  variant: ContainerVariant;
}

const LayoutPicker: React.FC<Props> = ({
  layout,
  setLayout,
  hasContainer = false,
  classNames,
  variant,
}) => {
  if (hasContainer) {
    return (
      <div className={cn("flex items-center gap-2.5", classNames?.container)}>
        {listLayouts.map((layoutItem) => {
          const isActive = layoutItem === layout;
          return (
            <LayoutPickerButton
              key={layoutItem}
              layout={layoutItem}
              isActive={isActive}
              onClick={() => setLayout?.(layoutItem)}
              variant={variant}
              className={classNames?.btn}
            />
          );
        })}
      </div>
    );
  }

  return (
    <>
      {listLayouts.map((layoutItem) => {
        const isActive = layoutItem === layout;
        return (
          <LayoutPickerButton
            key={layoutItem}
            layout={layoutItem}
            isActive={isActive}
            onClick={() => setLayout?.(layoutItem)}
            variant={variant}
            className={classNames?.btn}
          />
        );
      })}
    </>
  );
};

interface ButtonProps {
  layout: ListLayout;
  isActive: boolean;
  onClick?: () => void;
  variant: ContainerVariant;
  className?: string;
}

const LayoutPickerButton: React.FC<ButtonProps> = ({
  layout,
  isActive,
  onClick,
  variant,
  className,
}) => {
  const Icon = listLayoutsBtnIcons[layout];
  return (
    <Button
      className={className}
      variant={getButtonVariantFromContainerVariant({
        containerVariant: variant,
        isActive: isActive,
      })}
      size={"default"}
      onClick={onClick}
      title={layout}
    >
      <Icon className="sm:size-8" />
    </Button>
  );
};

export default LayoutPicker;
