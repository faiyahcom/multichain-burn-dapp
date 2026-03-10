import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PendingHoldingStatus = ({ poolDetail }: Props) => {
    const { handleCancelPool, handleCancelApprovalRequest } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | "cancelApproval" | null>(null);
    const isRunning = activeAction !== null;

    const run = async (name: "cancel" | "cancelApproval", fn: () => Promise<void>) => {
        setActiveAction(name);
        try {
            await fn();
        } finally {
            setActiveAction(null);
        }
    };

    return (
        <>
            <ActionBtn letter="C" text="Cancel Pool" color="#FF8E97"
                isLoading={activeAction === "cancel"}
                disabled={isRunning}
                onClick={() => run("cancel", handleCancelPool)}
            />
            <ActionBtn
                letter="A"
                text="Cancel Approval Request"
                color="#FFC198"
                isLoading={activeAction === "cancelApproval"}
                disabled={isRunning}
                onClick={() => run("cancelApproval", handleCancelApprovalRequest)}
            />
        </>
    );
};

export default PendingHoldingStatus;
