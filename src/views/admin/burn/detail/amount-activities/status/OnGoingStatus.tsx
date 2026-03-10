import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AnimateIconButton from "@/components/common/animate-icon-button";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
type Props = {
    poolDetail?: PoolDetailResponse;
};

const OnGoingStatus = ({ poolDetail }: Props) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [reason, setReason] = useState("");

    const { handleAdminClose } = useAmountActivity(poolDetail);

    const handleConfirmClose = async () => {
        await handleAdminClose(reason);
        setDialogOpen(false);
        setReason("");
    };

    const handleCancel = () => {
        setDialogOpen(false);
        setReason("");
    };

    return (
        <>
            <ActionBtn
                letter="C"
                text="Close Pool"
                color="#FF8E97"
                onClick={() => setDialogOpen(true)}
            />

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) handleCancel();
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
                        <DialogTitle>Emergency Close Pool</DialogTitle>
                        <DialogDescription className="mt-8 text-foreground">
                            Are you sure you want to emergency close this pool?
                        </DialogDescription>
                        <p className="text-sm text-secondary-text">
                            This action cannot be undone.
                        </p>
                    </DialogHeader>

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
                            btnProps={{ onClick: handleCancel }}
                        />
                        <AnimateIconButton
                            variant="letter-icon"
                            iconLetter="C"
                            textVariant="text-self-center"
                            text="Close Pool"
                            color="#9072F9"
                            classNames={{
                                btn: "after:text-2xl sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                                icon: "size-7.5 text-xl",
                                text: "text-2xl",
                            }}
                            btnProps={{ onClick: handleConfirmClose }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OnGoingStatus;
