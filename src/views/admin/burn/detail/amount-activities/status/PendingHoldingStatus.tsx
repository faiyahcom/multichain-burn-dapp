import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PendingHoldingStatus = ({ poolDetail }: Props) => {
    const { handleAdminApprove, handleAdminReject, handleEdit } =
        useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(
        null,
    );
    const isRunning = activeAction !== null;

    const run = async (name: "approve" | "reject", fn: () => Promise<void>) => {
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
                letter="U"
                text="Update Pool"
                color="#FF8E97"
                disabled={isRunning}
                onClick={handleEdit}
            />
            {poolDetail?.pool.status === "pending" && (
                <ActionBtn
                    letter="A"
                    text="Approve Pool"
                    color="#FFC198"
                    isLoading={activeAction === "approve"}
                    disabled={isRunning}
                    onClick={() => run("approve", handleAdminApprove)}
                />
            )}
            <ActionBtn
                letter="R"
                text="Reject Pool"
                color="#A5B7FF"
                isLoading={activeAction === "reject"}
                disabled={isRunning}
                onClick={() => run("reject", handleAdminReject)}
            />
        </>
    );
};

export default PendingHoldingStatus;
