import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import DepositRewardDialog from "../DepositRewardDialog";
import { toast } from "sonner";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DraftStatus = ({ poolDetail }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleCancelPool,
        handleDepositRewardWithAmount,
        handleEdit,
        handleSubmitPool,
    } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | "submit" | null>(
        null,
    );
    const isRunning = activeAction !== null;

    const run = async (name: "cancel" | "submit", fn: () => Promise<void>) => {
        setActiveAction(name);
        try {
            await fn();
        } finally {
            setActiveAction(null);
        }
    };

    const pastStartTime = poolDetail?.pool?.timeStart
        ? Date.now() / 1000 > Number(poolDetail.pool.timeStart)
        : false;

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
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
            <DepositRewardDialog
                open={depositRewardOpen}
                onOpenChange={setDepositRewardOpen}
                poolDetail={poolDetail}
                onConfirm={handleDepositRewardWithAmount}
            />
            <ActionBtn
                letter="E"
                text="Edit"
                color="#7AF4CB"
                disabled={isRunning}
                onClick={handleEdit}
            />
            <ActionBtn
                letter="S"
                text="Submit Pool"
                color="#A5B7FF"
                isLoading={activeAction === "submit"}
                disabled={isRunning}
                onClick={() => {
                    if (pastStartTime) {
                        toast.error(
                            "Start time has already passed. Please update the start time before submitting.",
                        );
                        return;
                    }
                    run("submit", handleSubmitPool);
                }}
            />
        </PoolChainGuard>
    );
};

export default DraftStatus;
