import { useMemo } from "react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { formatAmount } from "@/utils/helpers/numbers";
import { useBatchTransferSolFn } from "../hooks/useBatchTransferSolFn";
import { useBatchTransferEvmFn } from "../hooks/useBatchTransferEvmFn";
import { SOLANA_BACKEND_CHAIN_ID, chainIdToNetworkConfig } from "@/config/networks";
import type { BatchRecipient, TokenMode } from "../hooks/useBatchTransferSolFn";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import type { VaultBalance } from "../hooks/useOnChainVaultBalance";
import DepositRewardDialog from "../DepositRewardDialog";
import { useStakePoolComputedBalancesEvm } from "../hooks/useStakePoolComputedBalancesEvm";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const EndStatus = ({ poolDetail, vaultBalance }: Props) => {
    const {
        pool,
        depositRewardOpen,
        setDepositRewardOpen,
        handleDepositRewardWithAmount,
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
    const tokenInSymbolDisplay = stakingTokenDisplay.symbol;
    const rewardTokenDisplay = resolvePoolTokenDisplay({
        network: networkConfig,
        tokenAddress: poolDetail?.pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });
    const rewardTokenSymbolDisplay = rewardTokenDisplay.symbol;

    const refetchVaultBalance = vaultBalance?.refetch;
    const computedEvmBalances = useStakePoolComputedBalancesEvm({
        poolAddress: pool?.address,
        chainId: pool?.chainId,
        rewardToken: pool?.rewardToken,
        tokenIn: pool?.tokenIn,
        rewardTokenDecimals: pool?.rewardTokenDecimals,
        tokenInDecimals: pool?.tokenInDecimals,
        enabled: !isSolana,
    });

    const formattedRewardAvailable =
        isSolana
            ? (
                vaultBalance?.rewardBalance ??
                (pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
                    ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
                    : undefined)
            )
            : computedEvmBalances.formattedCurrentRewardAmount;

    const formattedDepositAvailable =
        isSolana
            ? (
                vaultBalance?.depositBalance ??
                (poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
                    ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
                    : undefined)
            )
            : computedEvmBalances.formattedCurrentDepositAmount;

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
        await computedEvmBalances.refetch();
    };

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
                onConfirm={handleDepositRewardWithAmount}
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
                    tokenInName: stakingTokenDisplay.name,
                    rewardTokenSymbol: rewardTokenSymbolDisplay,
                    rewardTokenName: rewardTokenDisplay.name,
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
