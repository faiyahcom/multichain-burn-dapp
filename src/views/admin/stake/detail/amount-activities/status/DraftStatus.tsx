import { useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import DepositRewardDialog from "../DepositRewardDialog";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const DraftStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleCancelPool,
        handleDepositRewardWithAmount,
        handleEdit,
        handleSubmitPool,
    } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | "submit" | null>(null);
    const isRunning = activeAction !== null;

    const run = async (name: "cancel" | "submit", fn: () => Promise<void>) => {
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
                vaultBalance={vaultBalance}
                onConfirm={handleDepositRewardWithAmount}
            />
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" disabled={isRunning} onClick={handleEdit} />
            <ActionBtn
                letter="S"
                text="Submit Pool"
                color="#A5B7FF"
                isLoading={activeAction === "submit"}
                disabled={isRunning}
                onClick={() => run("submit", handleSubmitPool)}
            />
        </PoolChainGuard>
    );
};

export default DraftStatus;
