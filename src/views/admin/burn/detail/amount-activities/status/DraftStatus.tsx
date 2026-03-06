import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, AmountInput } from "../components";
import { useAmountActivity } from "../use-amount-activity";

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

    return (
        <>
            <ActionBtn letter="C" text="Cancel Pool" color="#FF8E97" onClick={handleCancelPool} />
            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                onClick={() => setDepositRewardOpen((o) => !o)}
            />
            <AmountInput
                open={depositRewardOpen}
                value={depositRewardInput}
                onChange={setDepositRewardInput}
                onConfirm={handleDepositReward}
                placeholder={`Amount (${pool?.rewardTokenSymbol ?? ""})`}
            />
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" onClick={handleEdit} />
            <ActionBtn letter="R" text="Request Approve" color="#A5B7FF" onClick={handleRequestApprove} />
        </>
    );
};

export default DraftStatus;
