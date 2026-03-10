import { useMemo, useState } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, AmountInput } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const DraftStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        depositRewardOpen,
        setDepositRewardOpen,
        depositRewardInput,
        setDepositRewardInput,
        handleCancelPool,
        handleDepositReward,
        handleEdit,
        handleRequestApprove,
    } = useAmountActivity(poolDetail);

    const [activeAction, setActiveAction] = useState<"cancel" | "approve" | null>(null);
    const isRunning = activeAction !== null;

    const networkConfig = useMemo(
        () => pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined,
        [pool?.chainId],
    );
    const rewardTokenSymbolDisplay = pool?.assetTypeReward === AssetTypeEnum.NATIVE
        ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.rewardTokenSymbol ?? "")
        : (pool?.rewardTokenSymbol ?? "");

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
            <ActionBtn letter="C" text="Cancel Pool" color="#FF8E97"
                isLoading={activeAction === "cancel"}
                disabled={isRunning}
                onClick={() => run("cancel", handleCancelPool)}
            />
            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                disabled={isRunning}
                onClick={() => setDepositRewardOpen((o) => !o)}
            />
            <AmountInput
                open={depositRewardOpen}
                value={depositRewardInput}
                onChange={setDepositRewardInput}
                onConfirm={handleDepositReward}
                placeholder={`Amount (${rewardTokenSymbolDisplay})`}
            />
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" disabled={isRunning} onClick={handleEdit} />
            <ActionBtn letter="R" text="Request Approve" color="#A5B7FF"
                isLoading={activeAction === "approve"}
                disabled={isRunning}
                onClick={() => run("approve", handleRequestApprove)}
            />
        </>
    );
};

export default DraftStatus;
