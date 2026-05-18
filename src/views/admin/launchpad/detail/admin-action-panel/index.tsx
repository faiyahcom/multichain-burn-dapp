import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import type { PoolDetailResponse } from "@/types/pool";
import { ActionBtn, Container } from "./components";
import { useAdminAction } from "./useAdminAction";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import ClosePoolDialog from "@/components/shared/close-pool-dialog";
import ConfirmDialog from "@/components/common/confirm-dialog";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const AdminActionPanel = ({ poolDetail }: Props) => {
  const { address: walletAddress } = useAppKitAccount();
  const status = poolDetail?.pool?.status;

  const {
    handleCancelPool,
    handleSubmitPool,
    handleEdit,
    handleEmergencyClose,
    handleWithdrawRaised,
    handleWithdrawRemainingSale,
  } = useAdminAction(poolDetail);

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isRunning = activeAction !== null || isWithdrawing;

  const run = async (name: string, fn: () => Promise<void>) => {
    setActiveAction(name);
    try {
      await fn();
    } finally {
      setActiveAction(null);
    }
  };

  const handleWithdrawConfirm = () => {
    const recipient = walletAddress ?? "";
    if (!recipient) return;
    setIsWithdrawing(true);
    (async () => {
      try {
        await handleWithdrawRaised(recipient);
        await handleWithdrawRemainingSale(recipient);
        setWithdrawDialogOpen(false);
      } finally {
        setIsWithdrawing(false);
      }
    })();
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
              isLoading={isWithdrawing}
              disabled={isRunning}
              onClick={() => setWithdrawDialogOpen(true)}
            />
            <ClosePoolDialog
              open={closeDialogOpen}
              onOpenChange={setCloseDialogOpen}
              title="Emergency Close Pool"
              description="Are you sure you want to emergency close this pool?"
              showReason
              onConfirm={(reason) => handleEmergencyClose(reason)}
            />
            <ConfirmDialog
              open={withdrawDialogOpen}
              onOpenChange={setWithdrawDialogOpen}
              title="Transfer Tokens"
              description={`Withdraw raised funds and remaining sale tokens to your wallet (${walletAddress ?? "connected wallet"}).`}
              buttonConfirmText="Withdraw"
              isLoading={isWithdrawing}
              onConfirm={handleWithdrawConfirm}
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

