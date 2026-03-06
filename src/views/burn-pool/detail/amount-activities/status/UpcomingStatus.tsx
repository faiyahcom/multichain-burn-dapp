import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/ui/button";
import { ActionBtn, AmountInput, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedBurned,
        depositBurnOpen,
        setDepositBurnOpen,
        depositBurnInput,
        setDepositBurnInput,
        handleDepositBurn,
    } = useAmountActivity(poolDetail);

    return (
        <>
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
                className="text-active"
                valueClassName="text-xl font-bold"
            />
            <StatRow label="Estimated Claimable Reward" value="0" />
            <Button className="w-full" disabled>
                Claim
            </Button>
            <ActionBtn
                letter="D"
                text="Deposit"
                onClick={() => setDepositBurnOpen((o) => !o)}
            />
            <AmountInput
                open={depositBurnOpen}
                value={depositBurnInput}
                onChange={setDepositBurnInput}
                onConfirm={handleDepositBurn}
                placeholder={`Amount (${pool?.tokenInSymbol ?? ""})`}
            />
        </>
    );
};

export default UpcomingStatus;
