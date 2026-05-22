import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, Container } from "./components";
import { useAdminAction } from "./useAdminAction";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";
import TransferTokensDialog from "@/views/admin/burn/detail/amount-activities/TransferTokensDialog";
import { useBatchTransferEvmFn } from "./hooks/useBatchTransferEvmFn";
import type {
  BatchRecipient,
  TokenMode,
} from "@/views/admin/stake/detail/amount-activities/hooks/useBatchTransferSolFn";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig, SOLANA_BACKEND_CHAIN_ID } from "@/config/networks";
import { formatAmount } from "@/utils/helpers/numbers";
import { useOnChainVaultBalance } from "@/views/admin/burn/detail/amount-activities/hooks/useOnChainVaultBalance";
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
  const network = pool?.chainId
    ? chainIdToNetworkConfig(pool.chainId)
    : undefined;

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

  const isSolanaPool = pool?.chainId === SOLANA_BACKEND_CHAIN_ID;

  const { rewardBalance: onChainReward, depositBalance: onChainDeposit, refetch: refetchVaultBalance } = useOnChainVaultBalance({
    poolAddress: pool?.address,
    chainId: pool?.chainId,
    rewardToken: pool?.rewardToken,
    tokenIn: pool?.tokenIn,
    rewardTokenDecimals: pool?.rewardTokenDecimals,
    tokenInDecimals: pool?.tokenInDecimals,
    assetTypeReward: pool?.assetTypeReward,
    assetTypeIn: pool?.assetTypeIn,
    refetchInterval: 10_000,
  });

  // Refetch balance on transfer modal open
  useEffect(() => {
    if (transferDialogOpen) {
      refetchVaultBalance();
    }
  }, [transferDialogOpen, refetchVaultBalance]);

  const formattedRaisedAmountBackend =
    poolDetail?.depositedAmount != null && pool?.tokenInDecimals != null
      ? formatAmount(poolDetail.depositedAmount, pool.tokenInDecimals)
      : undefined;
  const formattedRaisedAmount = onChainDeposit !== undefined ? onChainDeposit : formattedRaisedAmountBackend;

  const formattedRemainingSaleBackend =
    pool?.currentRewardAmount != null && pool?.rewardTokenDecimals != null
      ? formatAmount(pool.currentRewardAmount, pool.rewardTokenDecimals)
      : undefined;
  const formattedRemainingSale = onChainReward !== undefined ? onChainReward : formattedRemainingSaleBackend;

  const invalidatePoolQueries = (poolAddress: string) => {
    queryClient.invalidateQueries({
      queryKey: poolQueryKeys.detail(poolAddress),
      exact: false,
    });
  };

  const handleTransfer = async (
    recipients: BatchRecipient[],
    mode: TokenMode,
  ) => {
    if (!pool?.address || !poolDetail) return;
    if (isSolanaPool)
      throw new Error(
        "Token transfer is not yet available for Solana launchpad pools.",
      );
    await batchTransferEvm({
      poolAddress: pool.address,
      poolDetail,
      mode,
      recipients,
      onSuccess: () => refetchVaultBalance(),
    });
    invalidatePoolQueries(pool.address);
    refetchVaultBalance();
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
              onConfirm={async (reason) => {
                await handleEmergencyClose(reason);
                refetchVaultBalance();
              }}
            />
          </PoolChainGuard>
        );

      // ── Ongoing / Ended: Close Pool + Transfer Tokens ──────────────────────
      case "on_going":
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
              description="Are you sure you want to emergency close this pool?"
              showReason
              onConfirm={async (reason) => {
                await handleEmergencyClose(reason);
                refetchVaultBalance();
              }}
            />
          </PoolChainGuard>
        );
      case "completed":
        return (
          <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
              letter="T"
              text="Transfer Tokens"
              color="#FFC198"
              disabled={isRunning}
              onClick={() => setTransferDialogOpen(true)}
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
              onConfirm={async (reason) => {
                await handleEmergencyClose(reason);
                refetchVaultBalance();
              }}
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
      case "closed":
        return (
          <PoolChainGuard chainId={poolDetail?.pool?.chainId}>
            <ActionBtn
              letter="T"
              text="Transfer Tokens"
              color="#FFC198"
              disabled={isRunning}
              onClick={() => setTransferDialogOpen(true)}
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
            {poolDetail?.pool?.adminCloseReason && (
              <div className="flex gap-1 text-[15px]">
                <span className="font-medium text-foreground">
                  Reason close pool:{" "}
                </span>
                <p className="text-greyed">{poolDetail?.pool?.adminCloseReason}</p>
              </div>
            )}
          </PoolChainGuard>
        );
      // ── Cancelled: No actions ──────────────────────────────────────────────
      case "canceled":
        return <p className="text-sm text-greyed">No actions available.</p>;

      default:
        return null;
    }
  };

  return <Container>{renderActions()}</Container>;
};

export default AdminActionPanel;
