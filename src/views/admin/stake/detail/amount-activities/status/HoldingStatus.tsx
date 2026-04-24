import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const HoldingStatus = ({ poolDetail }: Props) => {
    const { handleCancelPool, handleEdit } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | null>(null);
    const isRunning = activeAction !== null;

    const run = async (name: "cancel", fn: () => Promise<void>) => {
        setActiveAction(name);
        try {
            await fn();
        } finally {
            setActiveAction(null);
        }
    };

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
                letter="E"
                text="Edit"
                color="#7AF4CB"
                disabled={isRunning}
                onClick={handleEdit}
            />
        </PoolChainGuard>
    );
};

export default HoldingStatus;
