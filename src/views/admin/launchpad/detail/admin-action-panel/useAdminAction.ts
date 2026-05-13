import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKitProvider } from "@reown/appkit/react";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { poolService } from "@/services/poolService";
import type { PoolDetailResponse } from "@/types/pool";
import { useCancelPoolEvmFn } from "./hooks/useCancelPoolEvmFn";
import { useSubmitPoolEvmFn } from "./hooks/useSubmitPoolEvmFn";
import { useEmergencyCloseEvmFn } from "./hooks/useEmergencyCloseEvmFn";
import { useWithdrawEvmFn } from "./hooks/useWithdrawEvmFn";
import { useEmergencyCloseSolFn } from "./hooks/useEmergencyCloseSolFn";

export const useAdminAction = (poolDetail?: PoolDetailResponse) => {
    const { caipAddress } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // EVM hooks
    const { cancelPoolEvm } = useCancelPoolEvmFn();
    const { submitPoolEvm } = useSubmitPoolEvmFn();
    const { emergencyCloseEvm } = useEmergencyCloseEvmFn();
    const { withdrawRaisedEvm, withdrawRemainingSaleEvm } = useWithdrawEvmFn();

    // Sol hooks
    const { emergencyCloseSol } = useEmergencyCloseSolFn();

    const pool = poolDetail?.pool;

    const invalidatePool = (poolAddress: string) => {
        queryClient.invalidateQueries({
            queryKey: poolQueryKeys.detail(poolAddress),
            exact: false,
        });
    };

    // ── Draft actions ─────────────────────────────────────────────────────────

    const handleCancelPool = async () => {
        if (!pool?.address) return;
        if (isSolana) {
            throw new Error("Cancel pool is not available for Solana launchpad pools.");
        }
        await cancelPoolEvm({ poolAddress: pool.address });
        invalidatePool(pool.address);
    };

    const handleSubmitPool = async () => {
        if (!pool?.address || !poolDetail) return;
        if (isSolana) {
            throw new Error("Submit pool is not available for Solana launchpad pools.");
        }
        await submitPoolEvm({ poolAddress: pool.address, poolDetail });
        invalidatePool(pool.address);
    };

    const handleEdit = () => {
        if (!pool?.address) return;
        navigate({
            to: "/admin/launchpad/edit/$address",
            params: { address: pool.address },
        });
    };

    // ── Close (emergency) ─────────────────────────────────────────────────────

    const handleEmergencyClose = async (reason?: string) => {
        if (!pool?.address) return;
        if (isSolana) {
            await emergencyCloseSol({ poolAddress: pool.address });
        } else {
            await emergencyCloseEvm({ poolAddress: pool.address });
        }
        if (reason?.trim()) {
            await poolService.postReasonClosePool(pool.address, reason);
        }
        invalidatePool(pool.address);
    };

    // ── Withdraw (ended / ongoing) ────────────────────────────────────────────

    const handleWithdrawRaised = async (recipientAddress: string) => {
        if (!pool?.address) return;
        if (isSolana) {
            throw new Error("Withdraw raised is not yet available for Solana launchpad pools.");
        }
        // depositedAmount is in raw units (string from backend)
        const amount = BigInt(poolDetail?.depositedAmount ?? "0");
        await withdrawRaisedEvm({
            poolAddress: pool.address,
            recipientAddress,
            amount,
        });
        invalidatePool(pool.address);
    };

    const handleWithdrawRemainingSale = async (recipientAddress: string) => {
        if (!pool?.address) return;
        if (isSolana) {
            throw new Error("Withdraw remaining sale is not yet available for Solana launchpad pools.");
        }
        // currentRewardAmount is in raw units (string from backend)
        const amount = BigInt(pool.currentRewardAmount ?? "0");
        await withdrawRemainingSaleEvm({
            poolAddress: pool.address,
            recipientAddress,
            amount,
        });
        invalidatePool(pool.address);
    };

    return {
        pool,
        isSolana,
        handleCancelPool,
        handleSubmitPool,
        handleEdit,
        handleEmergencyClose,
        handleWithdrawRaised,
        handleWithdrawRemainingSale,
    };
};
