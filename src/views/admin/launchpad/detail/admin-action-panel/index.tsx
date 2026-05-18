import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, Container } from "./components";
import { useAdminAction } from "./useAdminAction";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { useBatchTransferEvmFn } from "./hooks/useBatchTransferEvmFn";
import type { BatchRecipient, TokenMode } from "@/views/admin/stake/detail/amount-activities/hooks/useBatchTransferSolFn";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { useQueryClient } from "@tanstack/react-query";
import { poolQueryKeys } from "@/services/queries/queryKey";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const AdminActionPanel = ({ poolDetail }: Props) => {
  const { } = useAppKitAccount();
  const status = poolDetail?.pool?.status;
  const queryClient = useQueryClient();

  const {
    handleCancelPool,
    handleSubmitPool,
    handleEdit,
    handleEmergencyClose,
    isSolana,
  } = useAdminAction(poolDetail);

  const { batchTransferEvm } = useBatchTransferEvmFn();

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const isRunning = activeAction !== null;

  const run = async (name: string, fn: () => Promise<void>) => {
    setActiveAction(name);
    try {
      await fn();
    } finally {
      setActiveAction(null);
    }
  };

  const pool = poolDetail?.pool;
  const network = pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined;

  const paymentTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });

  const saleTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const formattedRaisedAmount =
    poolDetail?.depositedAmount != null && pool?.tokenInDecimals != null
      ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
      : undefined;

  const formattedRemainingSale =
    pool?.currentRewardAmount != null && pool?.rewardTokenDecimals != null
      ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
      : undefined;

  const invalidatePoolQueries = (poolAddress: string) => {
    queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(poolAddress), exact: false });
  };

  const handleTransfer = async (recipients: BatchRecipient[], mode: TokenMode) => {
    if (!pool?.address || !poolDetail) return;
    if (isSolana) throw new Error("Token transfer is not yet available for Solana launchpad pools.");
    await batchTransferEvm({ poolAddress: pool.address, poolDetail, mode, recipients });
    invalidatePoolQueries(pool.address);
  };

  const renderActions = () => {
    switch (status) {
      // ── Draft: Cancel · Edit · Submit ──────────────────────────────────────
      case "draft":
        return (
          <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
              letter="C"
              text="Cancel Pool"
              color="#FF8E97"
              isLoading={activeAction === "cancel"}
              disabled={isRunning}
              onClick={() => run("cancel", handleCancelPool)}
            />
            <ActionBtn
              letter="E"
              text="Edit"
              color="#7AF4CB"
              disabled={isRunning}
              onClick={handleEdit}
            />
            <ActionBtn
              letter="S"
              text="Submit Pool"
              color="#A5B7FF"
              isLoading={activeAction === "submit"}
              disabled={isRunning}
              onClick={() => run("submit", handleSubmitPool)}
            />
          </PoolChainGuard>
        );

      // ── Upcoming: Close Pool (emergency) ───────────────────────────────────
      case "upcoming":
        return (
          <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
              letter="X"
              text="Close Pool"
              color="#FF6B6B"
              disabled={isRunning}
              onClick={() => setCloseDialogOpen(true)}
            />
            <ClosePoolDialog
              open={closeDialogOpen}
              onOpenChange={setCloseDialogOpen}
              title="Emergency Close Pool"
              description="Are you sure you want to emergency close this upcoming pool?"
              showReason
              onConfirm={(reason) => handleEmergencyClose(reason)}
            />
          </PoolChainGuard>
        );

      // ── Ongoing / Ended: Close Pool + Transfer Tokens ──────────────────────
      case "on_going":
      case "ended":
        return (
          <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
              letter="X"
              text="Close Pool"
              color="#FF6B6B"
              disabled={isRunning}
              onClick={() => setCloseDialogOpen(true)}
            />
            <ActionBtn
              letter="T"
              text="Transfer Tokens"
              color="#FFC198"
              disabled={isRunning}
              onClick={() => setTransferDialogOpen(true)}
            />
            <ClosePoolDialog
              open={closeDialogOpen}
              onOpenChange={setCloseDialogOpen}
              title="Emergency Close Pool"
              description="Are you sure you want to emergency close this pool?"
              showReason
              onConfirm={(reason) => handleEmergencyClose(reason)}
            />
            <TransferTokensDialog
              open={transferDialogOpen}
              onOpenChange={setTransferDialogOpen}
              chainId={pool?.chainId ?? ""}
              poolKind={pool?.kind}
              poolInfo={{
                tokenInSymbol: paymentTokenDisplay.symbol,
                tokenInName: paymentTokenDisplay.name,
                rewardTokenSymbol: saleTokenDisplay.symbol,
                rewardTokenName: saleTokenDisplay.name,
                currentRewardAmount: formattedRemainingSale,
                currentDepositAmount: formattedRaisedAmount,
                rewardTokenDecimals: pool?.rewardTokenDecimals,
                tokenInDecimals: pool?.tokenInDecimals,
              }}
              onTransfer={handleTransfer}
            />
          </PoolChainGuard>
        );

      // ── Cancelled: No actions ──────────────────────────────────────────────
      case "canceled":
        return (
          <p className="text-sm text-greyed">No actions available.</p>
        );

      default:
        return null;
    }
  };

  return <Container>{renderActions()}</Container>;
};

export default AdminActionPanel;

