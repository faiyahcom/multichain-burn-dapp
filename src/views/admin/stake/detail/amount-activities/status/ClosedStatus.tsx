import { useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { formatAmount } from "@/utils/helpers/numbers";
import { useBatchTransferSolFn } from "../hooks/useBatchTransferSolFn";
import { useBatchTransferEvmFn } from "../hooks/useBatchTransferEvmFn";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";
import { SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import type { BatchRecipient, TokenMode } from "../hooks/useBatchTransferSolFn";
import { chainIdToNetworkConfig } from "@/config/networks";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const ClosedStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        pool,
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

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network: networkConfig,
        tokenAddress: poolDetail?.pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network: networkConfig,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const tokenInSymbolDisplay = stakingTokenDisplay.symbol;
    const rewardTokenSymbolDisplay = rewardTokenDisplay.symbol;

    const onChainReward = vaultBalance?.rewardBalance;
    const onChainDeposit = vaultBalance?.depositBalance;
    const refetchVaultBalance = vaultBalance?.refetch;

    const formattedRewardAvailableBackend =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;
    const formattedRewardAvailable =
        onChainReward !== undefined ? onChainReward : formattedRewardAvailableBackend;

    const formattedDepositAvailableBackend =
        poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
            ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
            : undefined;
    const formattedDepositAvailable =
        onChainDeposit !== undefined ? onChainDeposit : formattedDepositAvailableBackend;

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
        <PoolChainGuard chainId={pool?.chainId}>
            <StatRow
                label="Staking Remaining"
                value={
                    formattedDepositAvailable !== undefined ? (
                        `${formattedDepositAvailable} ${tokenInSymbolDisplay}`
                    ) : (
                        <Skeleton className="h-5 w-28" />
                    )
                }
                className="gap-1 font-medium text-active"
                valueClassName="text-2xl font-bold max-sm:text-right"
            />
            <StatRow
                label="Reward Remaining"
                value={
                    formattedRewardAvailable !== undefined ? (
                        `${formattedRewardAvailable} ${rewardTokenSymbolDisplay}`
                    ) : (
                        <Skeleton className="h-5 w-28" />
                    )
                }
                className="gap-1 font-medium text-active"
                valueClassName="text-2xl font-bold max-sm:text-right"
            />
            <ActionBtn
                letter="T"
                text="Transfer Token"
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

export default ClosedStatus;
