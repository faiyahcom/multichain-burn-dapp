import {
  listLayouts,
  listLayoutsBtnIcons,
  type ListLayout,
} from "@/types/common";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface Props {
  layout?: ListLayout;
  setLayout?: (layout: ListLayout) => void;
  hasContainer?: boolean;
  classNames?: {
    container?: string;
  };
}

const LayoutPicker: React.FC<Props> = ({
  layout,
  setLayout,
  hasContainer = false,
  classNames,
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
}

const LayoutPickerButton: React.FC<ButtonProps> = ({
  layout,
  isActive,
  onClick,
}) => {
  const Icon = listLayoutsBtnIcons[layout];
  return (
    <Button
      className="capitalize"
      variant={isActive ? "mb-active" : "mb-inactive"}
      size={"mb-btn"}
      onClick={onClick}
    >
      <Icon />
      {layout}
    </Button>
  );
};

export default LayoutPicker;
