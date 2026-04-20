import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import DepositRewardDialog from "../DepositRewardDialog";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";
import { useAuthStore } from "@/stores/authStore";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const UpcomingStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleDepositRewardWithAmount,
        handleEmergencyClose,
    } = useAmountActivity(poolDetail);

    const isSuperAdmin = useAuthStore(
        (state) => state.user?.role === "super_admin",
    );

    const [closeDialogOpen, setCloseDialogOpen] = useState(false);

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            {isSuperAdmin && (
                <ActionBtn
                    letter="C"
                    text="Close Pool"
                    color="#FF8E97"
                    onClick={() => setCloseDialogOpen(true)}
                />
            )}
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
            {isSuperAdmin && (
                <ClosePoolDialog
                    open={closeDialogOpen}
                    onOpenChange={setCloseDialogOpen}
                    title="Close Pool"
                    description="Are you sure you want to close this upcoming pool?"
                    onConfirm={handleEmergencyClose}
                    showReason
                    confirmIconLetter="X"
                />
            )}
        </PoolChainGuard>
    );
};

export default UpcomingStatus;
