import { useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, AmountInput } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const EndStatus = ({ poolDetail, vaultBalance: _vaultBalance }: Props) => {
    const {
        pool,
        depositRewardOpen,
        setDepositRewardOpen,
        depositRewardInput,
        setDepositRewardInput,
        handleDepositReward,
        setTransferDialogOpen,
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
            <ActionBtn
                letter="T"
                text="Transfer Tokens"
                color="#A5B7FF"
                onClick={() => setTransferDialogOpen(true)}
            />
        </PoolChainGuard>
    );
};

export default EndStatus;
