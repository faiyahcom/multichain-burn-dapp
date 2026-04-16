import { useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, AmountInput } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { formatAmount } from "@/utils/helpers/numbers";
import { useBatchTransferSolFn } from "../hooks/useBatchTransferSolFn";
import { useBatchTransferEvmFn } from "../hooks/useBatchTransferEvmFn";
import { SOLANA_BACKEND_CHAIN_ID, chainIdToNetworkConfig } from "@/config/networks";
import type { BatchRecipient, TokenMode } from "../hooks/useBatchTransferSolFn";
import { AssetTypeEnum } from "@/web3/helpers";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const EndStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        pool,
        depositRewardOpen,
        setDepositRewardOpen,
        depositRewardInput,
        setDepositRewardInput,
        handleDepositReward,
        transferDialogOpen,
        setTransferDialogOpen,
        invalidatePoolQueries,
    } = useAmountActivity(poolDetail);

    const { batchTransferSol } = useBatchTransferSolFn();
    const { batchTransferEvm } = useBatchTransferEvmFn();
    const isSolana = pool?.chainId === SOLANA_BACKEND_CHAIN_ID;

    const networkConfig = useMemo(
        () => (pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined),
        [pool?.chainId],
    );

    const rewardTokenSymbolDisplay =
        pool?.assetTypeReward === AssetTypeEnum.NATIVE
            ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.rewardTokenSymbol ?? "")
            : (pool?.rewardTokenSymbol ?? "");

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network: networkConfig,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const tokenInSymbolDisplay = stakingTokenDisplay.symbol;

    const onChainReward = vaultBalance?.rewardBalance;
    const onChainDeposit = vaultBalance?.depositBalance;
    const refetchVaultBalance = vaultBalance?.refetch;

    const formattedRewardAvailable =
        onChainReward !== undefined
            ? onChainReward
            : pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
              ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
              : undefined;

    const formattedDepositAvailable =
        onChainDeposit !== undefined
            ? onChainDeposit
            : poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
              ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
              : undefined;

    const handleTransfer = async (recipients: BatchRecipient[], mode: TokenMode) => {
        if (!pool) return;
        if (isSolana) {
            await batchTransferSol({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
                onSuccess: () => refetchVaultBalance?.(),
            });
        } else {
            await batchTransferEvm({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
                onSuccess: () => refetchVaultBalance?.(),
            });
        }
        invalidatePoolQueries(pool.address);
        refetchVaultBalance?.();
    };

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

            <TransferTokensDialog
                open={transferDialogOpen}
                onOpenChange={setTransferDialogOpen}
                chainId={pool?.chainId ?? ""}
                poolKind={pool?.kind}
                poolInfo={{
                    tokenInSymbol: tokenInSymbolDisplay,
                    rewardTokenSymbol: rewardTokenSymbolDisplay,
                    currentRewardAmount: formattedRewardAvailable,
                    currentDepositAmount: formattedDepositAvailable,
                    rewardTokenDecimals: pool?.rewardTokenDecimals,
                    tokenInDecimals: pool?.tokenInDecimals,
                }}
                onTransfer={handleTransfer}
            />
        </PoolChainGuard>
    );
};

export default EndStatus;
