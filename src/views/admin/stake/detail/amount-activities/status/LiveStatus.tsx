import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import DepositRewardDialog from "../DepositRewardDialog";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";

type Props = {
    poolDetail?: PoolDetailResponse;
    onAfterClose?: () => void;
};

const LiveStatus = ({ poolDetail, onAfterClose }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleDepositRewardWithAmount,
        handleEmergencyClose,
    } = useAmountActivity(poolDetail);

    const [closeDialogOpen, setCloseDialogOpen] = useState(false);

    const handleClose = async (reason?: string) => {
        await handleEmergencyClose(reason);
        onAfterClose?.();
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
                onConfirm={handleDepositRewardWithAmount}
            />
            <ClosePoolDialog
                open={closeDialogOpen}
                onOpenChange={setCloseDialogOpen}
                showReason
                confirmText="Emergency Close"
                confirmIconLetter="X"
                onConfirm={handleClose}
            />
        </PoolChainGuard>
    );
};

export default LiveStatus;
