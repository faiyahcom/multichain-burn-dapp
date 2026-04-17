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

const UpcomingStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        depositRewardOpen,
        setDepositRewardOpen,
        handleDepositRewardWithAmount,
    } = useAmountActivity(poolDetail);

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
                letter="D"
                text="Deposit Reward"
                color="#FFC198"
                onClick={() => setDepositRewardOpen(true)}
            />
            <DepositRewardDialog
                open={depositRewardOpen}
                onOpenChange={setDepositRewardOpen}
                poolDetail={poolDetail}
                vaultBalance={vaultBalance}
                onConfirm={handleDepositRewardWithAmount}
            />
        </PoolChainGuard>
    );
};

export default UpcomingStatus;
