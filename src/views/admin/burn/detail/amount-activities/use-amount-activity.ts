import { useMemo, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { poolQueryKeys } from "@/services/queries/queryKey";

import { useCancelBurnPoolEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useCancelBurnPoolEvmFn";
import { useDepositRewardEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useDepositRewardEvmFn";
import { useDepositBurnEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useDepositBurnEvmFn";
import { useClaimBurnEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useClaimBurnEvmFn";
import { useRequestApprovePoolEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useRequestApprovePoolEvmFn";
import { useRequestApprovePoolSolFn } from "@/views/burn-pool/detail/amount-activities/hooks/useRequestApprovePoolSolFn";
import { useCancelBurnPoolSolFn } from "@/views/burn-pool/detail/amount-activities/hooks/useCancelBurnPoolSolFn";
import { useClaimBurnSolFn } from "@/views/burn-pool/detail/amount-activities/hooks/useClaimBurnSolFn";
import { useCancelRequestApproveEvmFn } from "@/views/burn-pool/detail/amount-activities/hooks/useCancelRequestApproveEvmFn";
import { useCancelRequestApproveSolFn } from "@/views/burn-pool/detail/amount-activities/hooks/useCancelRequestApproveSolFn";
import { useAdminApprovePoolEvmFn } from "./hooks/useAdminApprovePoolEvmFn";
import { useAdminApprovePoolSolFn } from "./hooks/useAdminApprovePoolSolFn";
import { useAdminRejectPoolEvmFn } from "./hooks/useAdminRejectPoolEvmFn";
import { useAdminRejectPoolSolFn } from "./hooks/useAdminRejectPoolSolFn";
import { useAdminClosePoolEvmFn } from "./hooks/useAdminClosePoolEvmFn";
import { useAdminClosePoolSolFn } from "./hooks/useAdminClosePoolSolFn";
import { poolService } from "@/services/poolService";
import { useNavigate } from "@tanstack/react-router";

export const useAmountActivity = (poolDetail?: PoolDetailResponse) => {
    const { user } = useAuthStore();
    const { caipAddress } = useAppKitAccount();
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";
    const queryClient = useQueryClient();

    // ── EVM hooks ──────────────────────────────────────────────
    const { cancelBurnPool } = useCancelBurnPoolEvmFn();
    const { depositRewardEvm } = useDepositRewardEvmFn();
    const { depositBurnEvm } = useDepositBurnEvmFn();
    const { claimBurnReward } = useClaimBurnEvmFn();
    const { requestApprovePool } = useRequestApprovePoolEvmFn();
    // ── Solana hooks ───────────────────────────────────────────
    const { cancelBurnPoolSol } = useCancelBurnPoolSolFn();
    const { requestApproveSol } = useRequestApprovePoolSolFn();
    const { claimBurnSol } = useClaimBurnSolFn();
    const { cancelRequestApproveEvm } = useCancelRequestApproveEvmFn();
    const { cancelRequestApproveSol } = useCancelRequestApproveSolFn();
    // ── Admin hooks ────────────────────────────────────────────
    const { adminApprovePoolEvm } = useAdminApprovePoolEvmFn();
    const { adminApprovePoolSol } = useAdminApprovePoolSolFn();
    const { adminRejectPoolEvm } = useAdminRejectPoolEvmFn();
    const { adminRejectPoolSol } = useAdminRejectPoolSolFn();
    const { adminClosePoolEvm } = useAdminClosePoolEvmFn();
    const { adminClosePoolSol } = useAdminClosePoolSolFn();

    // ── Amount-input state ─────────────────────────────────────
    const [depositRewardInput, setDepositRewardInput] = useState("");
    const [depositRewardOpen, setDepositRewardOpen] = useState(false);
    const [depositBurnInput, setDepositBurnInput] = useState("");
    const [depositBurnOpen, setDepositBurnOpen] = useState(false);
    // ── Transfer dialog state ──────────────────────────────────
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);

    const pool = poolDetail?.pool;
    const userAmount = poolDetail?.userAmount;

    const status = pool?.status;
    const isPoolOwner = user?.address === pool?.owner;

    // ── Formatted values ───────────────────────────────────────
    const formattedBurned = useMemo(() => {
        if (!pool || !userAmount || pool.tokenInDecimals === undefined) return "-";
        return formatAmount(userAmount.deposited, pool.tokenInDecimals);
    }, [pool, userAmount]);

    const formattedReward = useMemo(() => {
        if (!pool || !userAmount || pool.rewardTokenDecimals === undefined)
            return "-";
        return formatAmount(userAmount.claimed, pool.rewardTokenDecimals);
    }, [pool, userAmount]);

    const formattedReturnReward = useMemo(() => {
        if (!pool || pool.rewardTokenDecimals === undefined) return "-";
        return formatAmount(
            pool.currentRewardAmount ?? 0,
            pool.rewardTokenDecimals,
        );
    }, [pool]);

    const hasClaimed = Boolean(userAmount?.claimed);

    // ── Query invalidation helper ──────────────────────────────
    const invalidatePoolQueries = (poolAddress: string) => {
        queryClient.invalidateQueries({
            queryKey: poolQueryKeys.detail(poolAddress),
            exact: false,
        });
        queryClient.invalidateQueries({
            queryKey: ["pools", "txns", poolAddress],
            exact: false,
        });
        queryClient.invalidateQueries({
            queryKey: ["pools", "activities", poolAddress],
            exact: false,
        });
    };

    // ── Action handlers ────────────────────────────────────────
    const handleCancelPool = async () => {
        if (!pool?.address) return;
        if (isSolana && poolDetail) {
            await cancelBurnPoolSol({ poolAddress: pool.address, poolDetail });
        } else {
            await cancelBurnPool({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleRequestApprove = async () => {
        if (!pool?.address) return;
        if (isSolana) {
            await requestApproveSol({ poolAddress: pool.address });
        } else {
            await requestApprovePool({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleDepositReward = async () => {
        if (!pool || !depositRewardInput) return;
        await depositRewardEvm({
            poolAddress: pool.address,
            rewardToken: pool.rewardToken,
            amountStr: depositRewardInput,
            decimals: pool.rewardTokenDecimals,
        });
        setDepositRewardInput("");
        setDepositRewardOpen(false);
        invalidatePoolQueries(pool.address);
    };

    const handleDepositBurn = async () => {
        if (!pool || !depositBurnInput) return;
        await depositBurnEvm({
            poolAddress: pool.address,
            burnToken: pool.tokenIn,
            amountStr: depositBurnInput,
            decimals: pool.tokenInDecimals,
        });
        setDepositBurnInput("");
        setDepositBurnOpen(false);
        invalidatePoolQueries(pool.address);
    };

    const handleClaim = async (userAddress?: string) => {
        if (!pool?.address) return;
        if (isSolana && poolDetail) {
            await claimBurnSol({ poolAddress: pool.address, poolDetail });
        } else {
            await claimBurnReward({ poolAddress: pool.address, userAddress });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleCancelApprovalRequest = async () => {
        if (!pool?.address) return;
        if (isSolana && poolDetail) {
            await cancelRequestApproveSol({ poolAddress: pool.address, poolDetail });
        } else {
            await cancelRequestApproveEvm({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const navigate = useNavigate();
    const handleEdit = () => {
        if (!pool?.address) return;
        navigate({
            to: "/admin/burn/edit/$address",
            params: { address: pool.address },
        });
    };

    const handleAdminApprove = async () => {
        if (!pool?.address) return;
        if (isSolana) {
            await adminApprovePoolSol({ poolAddress: pool.address });
        } else {
            await adminApprovePoolEvm({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleAdminReject = async () => {
        if (!pool?.address) return;
        if (isSolana) {
            await adminRejectPoolSol({ poolAddress: pool.address });
        } else {
            await adminRejectPoolEvm({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleAdminClose = async (reason?: string) => {
        if (!pool?.address) return;
        if (isSolana && poolDetail) {
            await adminClosePoolSol({ poolAddress: pool.address, poolDetail });
        } else {
            await adminClosePoolEvm({ poolAddress: pool.address });
        }
        if (reason?.trim()) {
            await poolService.postReasonClosePool(pool.address, reason);
        }
        invalidatePoolQueries(pool.address);
    };

    return {
        pool,
        status,
        isPoolOwner,
        // formatted
        formattedBurned,
        formattedReward,
        formattedReturnReward,
        hasClaimed,
        // deposit reward input
        depositRewardInput,
        setDepositRewardInput,
        depositRewardOpen,
        setDepositRewardOpen,
        // deposit burn input
        depositBurnInput,
        setDepositBurnInput,
        depositBurnOpen,
        setDepositBurnOpen,
        // transfer dialog
        transferDialogOpen,
        setTransferDialogOpen,
        // action handlers
        handleCancelPool,
        handleRequestApprove,
        handleDepositReward,
        handleDepositBurn,
        handleClaim,
        handleCancelApprovalRequest,
        handleEdit,
        // admin handlers
        handleAdminApprove,
        handleAdminReject,
        handleAdminClose,
        // util
        invalidatePoolQueries,
    };
};
