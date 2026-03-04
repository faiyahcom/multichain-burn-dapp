import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import AnimateIconButton from "./animate-icon-button";

interface Props {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title?: string;
  description?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  buttonCancelText?: string;
  buttonConfirmText?: string;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  title,
  description,
  onCancel,
  onConfirm,
  buttonCancelText = "Cancel",
  buttonConfirmText = "Accept",
  isLoading,
}) => {
  const buttonCancelTextFirstLetter = buttonCancelText
    .substring(0, 1)
    .toUpperCase();
  const buttonConfirmTextFirstLetter = buttonConfirmText
    .substring(0, 1)
    .toUpperCase();

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      onCancel?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-185.75"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <AnimateIconButton
            variant="letter-icon"
            iconLetter={buttonCancelTextFirstLetter}
            textVariant="text-container-center"
            text={buttonCancelText}
            color="#FF8E8E"
            classNames={{
              btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive",
            }}
            btnProps={{
              onClick: handleCancel,
              disabled: isLoading,
            }}
          />
          <AnimateIconButton
            variant="letter-icon"
            iconLetter={buttonConfirmTextFirstLetter}
            textVariant="text-self-center"
            text={buttonConfirmText}
            color="#9072F9"
            classNames={{
              btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
            }}
            btnProps={{
              onClick: handleConfirm,
              disabled: isLoading,
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
