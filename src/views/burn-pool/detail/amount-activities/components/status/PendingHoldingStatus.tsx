import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PendingHoldingStatus = ({ poolDetail }: Props) => {
    const { handleCancelPool, handleCancelApprovalRequest } = useAmountActivity(poolDetail);

    return (
        <>
            <ActionBtn letter="C" text="Cancel Pool" color="#FF8E97" onClick={handleCancelPool} />
            <ActionBtn
                letter="A"
                text="Cancel Approval Request"
                color="#FFC198"
                onClick={handleCancelApprovalRequest}
            />
        </>
    );
};

export default PendingHoldingStatus;
