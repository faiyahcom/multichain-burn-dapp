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
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import DepositRewardDialog from "../DepositRewardDialog";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const LiveStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleDepositRewardWithAmount,
        handleEmergencyClose,
    } = useAmountActivity(poolDetail);

    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleConfirmClose = async () => {
        setIsClosing(true);
        try {
            await handleEmergencyClose();
            setCloseDialogOpen(false);
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
                letter="X"
                text="Emergency Close"
                color="#FF8E97"
                onClick={() => setCloseDialogOpen(true)}
            />

            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                onClick={() => setDepositRewardOpen(true)}
            />

            <DepositRewardDialog
                open={depositRewardOpen}
                onOpenChange={setDepositRewardOpen}
                poolDetail={poolDetail}
                vaultBalance={vaultBalance}
                onConfirm={handleDepositRewardWithAmount}
            />

            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
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
                            btnProps={{ onClick: () => setCloseDialogOpen(false), disabled: isClosing }}
                        />
                        <AnimateIconButton
                            variant="letter-icon"
                            iconLetter="X"
                            textVariant="text-self-center"
                            text="Emergency Close"
                            color="#FF8E97"
                            classNames={{
                                btn: "sm:min-w-60.25 sm:py-4.25 sm:px-2.25 border border-mb-submit-border",
                                icon: "size-7.5 text-xl",
                                text: "text-2xl",
                            }}
                            isLoading={isClosing}
                            isLoadingText="Closing…"
                            btnProps={{ onClick: handleConfirmClose, disabled: isClosing }}
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PoolChainGuard>
    );
};

export default LiveStatus;
