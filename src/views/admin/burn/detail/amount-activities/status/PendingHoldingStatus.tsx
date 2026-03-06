import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const PendingHoldingStatus = ({ poolDetail }: Props) => {
    const { handleAdminApprove, handleAdminReject, handleEdit } = useAmountActivity(poolDetail);

    return (
        <>
            <ActionBtn letter="U" text="Update Pool" color="#FF8E97" onClick={handleEdit} />
            <ActionBtn letter="A" text="Approve Pool" color="#FFC198" onClick={handleAdminApprove} />
            <ActionBtn letter="R" text="Reject Pool" color="#A5B7FF" onClick={handleAdminReject} />
        </>
    );
};

export default PendingHoldingStatus;

