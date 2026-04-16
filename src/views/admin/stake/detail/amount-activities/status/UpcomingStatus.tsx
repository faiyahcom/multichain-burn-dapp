import { useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, AmountInput } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const UpcomingStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        depositRewardOpen,
        setDepositRewardOpen,
        depositRewardInput,
        setDepositRewardInput,
        handleDepositReward,
    } = useAmountActivity(poolDetail);

    const networkConfig = useMemo(
        () => (pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined),
        [pool?.chainId],
    );
    const rewardTokenSymbolDisplay =
        pool?.assetTypeReward === AssetTypeEnum.NATIVE
            ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.rewardTokenSymbol ?? "")
            : (pool?.rewardTokenSymbol ?? "");

    return (
        <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
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
                placeholder={`Amount (${rewardTokenSymbolDisplay})`}
            />
        </PoolChainGuard>
    );
};

export default UpcomingStatus;
