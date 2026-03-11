import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import TransferTokensDialog from "../TransferTokensDialog";
import { formatAmount } from "@/utils/helpers/numbers";
import { useBatchTransferSolFn } from "../hooks/useBatchTransferSolFn";
import { useBatchTransferEvmFn } from "../hooks/useBatchTransferEvmFn";
import { useOnChainVaultBalance } from "../hooks/useOnChainVaultBalance";
import { SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import type { BatchRecipient, TokenMode } from "../hooks/useBatchTransferSolFn";
import { useMemo } from "react";
import { chainIdToNetworkConfig } from "@/config/networks";
import { AssetTypeEnum } from "@/web3/helpers";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
    poolDetail?: PoolDetailResponse;
};

const ClosedStatus = ({ poolDetail }: Props) => {
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
        () => pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined,
        [pool?.chainId],
    );
    const tokenInSymbolDisplay = pool?.assetTypeIn === AssetTypeEnum.NATIVE
        ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.tokenInSymbol ?? "")
        : (pool?.tokenInSymbol ?? "");
    const rewardTokenSymbolDisplay = pool?.assetTypeReward === AssetTypeEnum.NATIVE
        ? (networkConfig?.appKitNetwork.nativeCurrency.symbol ?? pool?.rewardTokenSymbol ?? "")
        : (pool?.rewardTokenSymbol ?? "");

    // For Solana pools, use actual on-chain vault balance instead of stale backend data
    const { rewardBalance: onChainReward, depositBalance: onChainDeposit } = useOnChainVaultBalance({
        poolAddress: pool?.address,
        chainId: pool?.chainId,
        rewardTokenDecimals: pool?.rewardTokenDecimals,
        tokenInDecimals: pool?.tokenInDecimals,
        assetTypeReward: pool?.assetTypeReward,
        assetTypeIn: pool?.assetTypeIn,
    });

    const formattedAvailableBackend =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;
    const formattedAvailable = isSolana && onChainReward !== undefined
        ? onChainReward
        : formattedAvailableBackend;

    const formattedDepositAvailableBackend =
        poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
            ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
            : undefined;
    const formattedDepositAvailable = isSolana && onChainDeposit !== undefined
        ? onChainDeposit
        : formattedDepositAvailableBackend;

    const formattedTotalDeposited =
        poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
            ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
            : undefined;

    const formattedCurrentRewardAmountBackend =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;
    const formattedCurrentRewardAmount = isSolana && onChainReward !== undefined
        ? onChainReward
        : formattedCurrentRewardAmountBackend;

    const handleTransfer = async (recipients: BatchRecipient[], mode: TokenMode) => {
        if (!pool) return;
        if (isSolana) {
            await batchTransferSol({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
            });
        } else {
            await batchTransferEvm({
                poolAddress: pool.address,
                poolDetail: poolDetail!,
                mode,
                recipients,
            });
        }
        invalidatePoolQueries(pool.address);
    };

    return (
        <>
            <StatRow
                label="Total Deposited"
                value={formattedTotalDeposited !== undefined
                    ? `${formattedTotalDeposited} ${tokenInSymbolDisplay}`
                    : <Skeleton className="h-5 w-28" />}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <StatRow
                label="Remaining Reward"
                value={formattedCurrentRewardAmount !== undefined
                    ? `${formattedCurrentRewardAmount} ${rewardTokenSymbolDisplay}`
                    : <Skeleton className="h-5 w-28" />}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            />
            <ActionBtn
                letter="T"
                text="Transfer token"
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
            {poolDetail?.pool?.adminCloseReason && (
                <div className="flex gap-1 text-[15px]">
                    <span className="font-medium text-foreground">
                        Reason close pool:{" "}
                    </span>
                    <p className="text-greyed">{poolDetail.pool.adminCloseReason}</p>
                </div>
            )}
        </>
    );
};

export default ClosedStatus;
