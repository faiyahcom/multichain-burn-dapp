import { useState, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import DepositRewardDialog from "../deposit-reward";
import EditPoolDialog from "../edit-pool";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DraftStatus = ({ poolDetail }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        editPoolOpen,
        setEditPoolOpen,
        handleCancelPool,
        handleDepositReward,
        handleEdit,
        handleRequestApprove,
    } = useAmountActivity(poolDetail);

    const { depositReward } = useSearch({ from: '/burn/detail/$address' });
    const navigate = useNavigate({ from: '/burn/detail/$address' });

    useEffect(() => {
        if (depositReward) {
            setDepositRewardOpen(true);
            navigate({
                search: (prev: Record<string, unknown>) => { const { depositReward: _, ...rest } = prev; return rest as never; },
                replace: true,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" disabled={isRunning} onClick={() => setEditPoolOpen(true)} />
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
            <EditPoolDialog
                open={editPoolOpen}
                onOpenChange={setEditPoolOpen}
                poolDetail={poolDetail}
                onConfirm={handleEdit}
            />
        </>
    );
};

export default DraftStatus;
