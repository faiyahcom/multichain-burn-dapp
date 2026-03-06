import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import TransferTokensDialog from "../TransferTokensDialog";
import { formatAmount } from "@/utils/helpers/numbers";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
        handleClaim,
        transferDialogOpen,
        setTransferDialogOpen,
    } = useAmountActivity(poolDetail);

    const formattedAvailable = pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
        ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
        : undefined;

    return (
        <>
            <StatRow
                label="Close Reward"
                value={`${formattedReward} ${pool?.rewardTokenSymbol ?? ""}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
            />
            <ActionBtn
                letter="T"
                text="Transfer"
                onClick={() => setTransferDialogOpen(true)}
            />

            <TransferTokensDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                chainId={pool?.chainId ?? ""}
                poolInfo={{
                    tokenSymbol: pool?.tokenInSymbol,
                    rewardTokenSymbol: pool?.rewardTokenSymbol,
                    currentRewardAmount: formattedAvailable,
                    rewardTokenDecimals: pool?.rewardTokenDecimals,
                }}
                onTransfer={async (userAddress) => {
                    await handleClaim(userAddress);
                }}
            />
        </>
    );
};

export default ClosedStatus;
