import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AnimateIconButton from "@/components/common/animate-icon-button";

type ClosePoolDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    showReason?: boolean;
    confirmText?: string;
    confirmColor?: string;
    confirmIconLetter?: string;
    onConfirm: (reason: string) => Promise<void> | void;
};

const ClosePoolDialog = ({
    open,
    onOpenChange,
    title = "Emergency Close Pool",
    description = "Are you sure you want to emergency close this pool?",
    showReason = false,
    confirmText = "Close Pool",
    confirmColor = "#9072F9",
    confirmIconLetter = "C",
    onConfirm,
}: ClosePoolDialogProps) => {
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm(reason);
            setReason("");
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (isLoading) return;
        setReason("");
        onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) handleCancel();
            }}
        >
            <DialogContent
                className="sm:max-w-185.75"
                showCloseButton={false}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="mt-8 text-foreground">
                        {description}
                    </DialogDescription>
                    <p className="text-sm text-secondary-text">
                        This action cannot be undone.
                    </p>
                </DialogHeader>

                {showReason && (
                    <div className="flex flex-col gap-2 py-2">
                        <label className="ml-6 text-base">▪ Reason (optional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for audit or internal tracking..."
                            rows={4}
                            className="h-36 w-full resize-none rounded-md bg-inactive px-6 py-4 text-sm placeholder:text-secondary-text focus:outline-none"
                        />
                    </div>
                )}

                <DialogFooter className="gap-4.75 sm:justify-end">
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter="C"
                        textVariant="text-container-center"
                        text="Cancel"
                        color="#FF8E8E"
                        classNames={{
                            btn: "after:text-2xl sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-inactive",
                            icon: "size-7.5 text-xl",
                            text: "text-2xl",
                        }}
                        btnProps={{ onClick: handleCancel, disabled: isLoading }}
                    />
                    <AnimateIconButton
                        variant="letter-icon"
                        iconLetter={confirmIconLetter}
                        textVariant="text-self-center"
                        text={confirmText}
                        color={confirmColor}
                        classNames={{
                            btn: "after:text-2xl sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                            icon: "size-7.5 text-xl",
                            text: "text-2xl",
                        }}
                        isLoading={isLoading}
                        isLoadingText="Closing..."
                        btnProps={{ onClick: handleConfirm, disabled: isLoading }}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ClosePoolDialog;
