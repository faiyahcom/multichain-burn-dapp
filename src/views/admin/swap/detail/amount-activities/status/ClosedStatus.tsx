import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, StatRow } from "../components";
import { useAmountActivity } from "../use-amount-activity";
import { formatAmount } from "@/utils/helpers/numbers";
import { SOLANA_BACKEND_CHAIN_ID, chainIdToNetworkConfig } from "@/config/networks";
import {
    useBatchTransferSolFn,
    type BatchRecipient,
    type TokenMode,
} from "@/views/admin/burn/detail/amount-activities/hooks/useBatchTransferSolFn";
import { useBatchTransferEvmFn } from "@/views/admin/burn/detail/amount-activities/hooks/useBatchTransferEvmFn";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { useMemo } from "react";
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

    const formattedAvailable =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;

    const formattedDepositAvailable =
        poolDetail?.depositedAmount && pool?.tokenInDecimals !== undefined
            ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
            : undefined;

    const formattedCurrentRewardAmount =
        pool?.currentRewardAmount && pool?.rewardTokenDecimals !== undefined
            ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
            : undefined;

    const handleTransfer = async (
        recipients: BatchRecipient[],
        mode: TokenMode,
    ) => {
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
            {/* <StatRow
                label="Total Deposited"
                value={`${formattedTotalDeposited} ${pool?.tokenInSymbol ?? ""}`}
                className="font-medium text-active"
                valueClassName="text-2xl font-bold"
            /> */}
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
