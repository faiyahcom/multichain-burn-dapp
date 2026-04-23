import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { handleAdminClose } = useAmountActivity(poolDetail);

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
                letter="C"
                text="Close Pool"
                color="#FF8E97"
                onClick={() => setDialogOpen(true)}
            />
            <ClosePoolDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                showReason
                onConfirm={handleAdminClose}
            />
        </PoolChainGuard>
    );
};

export default UpcomingStatus;
