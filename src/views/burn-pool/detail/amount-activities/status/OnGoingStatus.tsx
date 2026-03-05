import type { PoolDetailResponse } from "@/types/pool";
import { IconTick } from "@/assets/react";
import { Button } from "@/components/ui/button";
import { ActionBtn, AmountInput, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const OnGoingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
        hasClaimed,
        depositBurnOpen,
        setDepositBurnOpen,
        depositBurnInput,
        setDepositBurnInput,
        handleDepositBurn,
    } = useAmountActivity(poolDetail);

    return (
        <>
            <StatRow
                label="Claimed Reward"
                value={`${formattedReward} ${pool?.rewardTokenSymbol ?? ""}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={`${formattedBurned} ${pool?.tokenInSymbol ?? ""}`}
            />
            {hasClaimed && (
                <div className="mx-1 inline-flex items-start gap-1">
                    <IconTick className="inline size-3.5 translate-y-0.5" />
                    <span className="text-sm text-greyed">
                        Reward has been sent to your wallet after pool end
                    </span>
                </div>
            )}
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

export default OnGoingStatus;
