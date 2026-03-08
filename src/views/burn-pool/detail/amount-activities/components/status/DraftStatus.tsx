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

    return (
        <>
            <ActionBtn
                letter="C"
                text="Cancel Pool"
                color="#FF8E97"
                onClick={handleCancelPool}
            />
            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                onClick={() => setDepositRewardOpen(true)}
            />
            <ActionBtn letter="E" text="Edit" color="#7AF4CB" onClick={handleEdit} />
            <ActionBtn
                letter="R"
                text="Request Approve"
                color="#A5B7FF"
                onClick={handleRequestApprove}
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
