import type { PoolDetailResponse } from "@/types/pool";
import { Button } from "@/components/ui/button";
import { ActionBtn, StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import DepositBurnDialog from "../deposit-burn";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const OnGoingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
        depositBurnOpen,
        setDepositBurnOpen,
        handleDepositBurn,
    } = useAmountActivity(poolDetail);

    return (
        <PoolChainGuard chainId={poolDetail?.pool.chainId}>
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
            {/* {hasClaimed && (
                <div className="mx-1 inline-flex items-start gap-1">
                    <IconTick className="inline size-3.5 translate-y-0.5" />
                    <span className="text-sm text-greyed">
                        Reward has been sent to your wallet after pool end
                    </span>
                </div>
            )} */}
            <Button className="w-full rounded-sm" disabled>
                Claim
            </Button>
            <ActionBtn
                letter="D"
                text="Deposit"
                onClick={() => setDepositBurnOpen(true)}
            />
            <DepositBurnDialog
                open={depositBurnOpen}
                onOpenChange={setDepositBurnOpen}
                poolDetail={poolDetail}
                onConfirm={handleDepositBurn}
            />
        </PoolChainGuard>
    );
};

export default OnGoingStatus;
