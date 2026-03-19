import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { SOLANA_BACKEND_CHAIN_ID, chainIdToNetworkConfig } from "@/config/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { useBatchTransferEvmFn } from "@/views/admin/burn/detail/amount-activities/hooks/useBatchTransferEvmFn";
import { useBatchTransferSolFn, type BatchRecipient, type TokenMode } from "@/views/admin/burn/detail/amount-activities/hooks/useBatchTransferSolFn";
import { useOnChainVaultBalance } from "@/views/admin/burn/detail/amount-activities/hooks/useOnChainVaultBalance";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { useMemo } from "react";
import { AssetTypeEnum } from "@/web3/helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const EndStatus = ({ poolDetail }: Props) => {
    const {
        pool,
        formattedReward,
        formattedBurned,
        transferDialogOpen,
        setTransferDialogOpen,
        invalidatePoolQueries,
    } = useAmountActivity(poolDetail);

    const { batchTransferSol } = useBatchTransferSolFn();
    const { batchTransferEvm } = useBatchTransferEvmFn();
    const isSolana = pool?.chainId === SOLANA_BACKEND_CHAIN_ID;

    const networkConfig = useMemo(
        () => pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined,
        [pool?.chainId],
    );
    const tokenInSymbolDisplay = pool?.assetTypeIn === AssetTypeEnum.NATIVE
        ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.tokenInSymbol ?? "")
        : (pool?.tokenInSymbol ?? "");
    const rewardTokenSymbolDisplay = pool?.assetTypeReward === AssetTypeEnum.NATIVE
        ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.rewardTokenSymbol ?? "")
        : (pool?.rewardTokenSymbol ?? "");

    // Use actual on-chain vault balance instead of potentially stale backend data
    const { rewardBalance: onChainReward, depositBalance: onChainDeposit, refetch: refetchVaultBalance } = useOnChainVaultBalance({
        poolAddress: pool?.address,
        chainId: pool?.chainId,
        rewardToken: pool?.rewardToken,
        tokenIn: pool?.tokenIn,
        rewardTokenDecimals: pool?.rewardTokenDecimals,
        tokenInDecimals: pool?.tokenInDecimals,
        assetTypeReward: pool?.assetTypeReward,
        assetTypeIn: pool?.assetTypeIn,
    });

    const formattedAvailableBackend =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;
    const formattedAvailable = onChainReward !== undefined
        ? onChainReward
        : formattedAvailableBackend;

    const formattedDepositAvailableBackend =
        poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
            ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
            : undefined;
    const formattedDepositAvailable = onChainDeposit !== undefined
        ? onChainDeposit
        : formattedDepositAvailableBackend;

    const handleTransfer = async (recipients: BatchRecipient[], mode: TokenMode) => {
        if (!pool) return;
        if (isSolana) {
            await batchTransferSol({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
                onSuccess: () => refetchVaultBalance(),
            });
        } else {
            await batchTransferEvm({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
                onSuccess: () => refetchVaultBalance(),
            });
        }
        invalidatePoolQueries(pool.address);
        refetchVaultBalance();
    };

    return (
        <PoolChainGuard chainId={pool?.chainId}>
            <StatRow
                label="Claimed Reward"
                value={!pool ? <Skeleton className="h-5 w-24" /> : `${formattedReward} ${rewardTokenSymbolDisplay}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Your Burned Amount"
                value={!pool ? <Skeleton className="h-4 w-20" /> : `${formattedBurned} ${tokenInSymbolDisplay}`}
            />
            <ActionBtn
                letter="T"
                text="Transfer"
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
                    currentRewardAmount: formattedAvailable,
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
