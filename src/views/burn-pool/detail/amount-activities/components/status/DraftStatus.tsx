import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import DepositRewardDialog from "../deposit-reward";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DraftStatus = ({ poolDetail }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleCancelPool,
        handleDepositReward,
        handleEdit,
        handleRequestApprove,
    } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | "approve" | null>(null);
    const isRunning = activeAction !== null;

    const run = async (name: "cancel" | "approve", fn: () => Promise<void>) => {
        setActiveAction(name);
        try {
            await fn();
        } finally {
            setActiveAction(null);
        }
    };

    return (
        <>
            <ActionBtn
                letter="C"
                text="Cancel Pool"
                color="#FF8E97"
                isLoading={activeAction === "cancel"}
                disabled={isRunning}
                onClick={() => run("cancel", handleCancelPool)}
            />
            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                disabled={isRunning}
                onClick={() => setDepositRewardOpen(true)}
            />
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" disabled={isRunning} onClick={handleEdit} />
            <ActionBtn
                letter="R"
                text="Request Approve"
                color="#A5B7FF"
                isLoading={activeAction === "approve"}
                disabled={isRunning}
                onClick={() => run("approve", handleRequestApprove)}
            />
            <DepositRewardDialog
                open={depositRewardOpen}
                onOpenChange={setDepositRewardOpen}
                poolDetail={poolDetail}
                onConfirm={handleDepositReward}
            />
        </>
    );
};

export default DraftStatus;
