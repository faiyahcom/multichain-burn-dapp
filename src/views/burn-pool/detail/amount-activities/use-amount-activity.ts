import { useMemo, useState } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { poolQueryKeys } from "@/services/queries/queryKey";

import { useCancelBurnPoolEvmFn } from "./hooks/useCancelBurnPoolEvmFn";
import { useDepositRewardEvmFn } from "./hooks/useDepositRewardEvmFn";
import { useDepositBurnEvmFn } from "./hooks/useDepositBurnEvmFn";
import { useClaimBurnEvmFn } from "./hooks/useClaimBurnEvmFn";
import { useRequestApprovePoolEvmFn } from "./hooks/useRequestApprovePoolEvmFn";
import { useRequestApprovePoolSolFn } from "./hooks/useRequestApprovePoolSolFn";
import { useCancelBurnPoolSolFn } from "./hooks/useCancelBurnPoolSolFn";
import { useClaimBurnSolFn } from "./hooks/useClaimBurnSolFn";
import { useCancelRequestApproveEvmFn } from "./hooks/useCancelRequestApproveEvmFn";
import { useCancelRequestApproveSolFn } from "./hooks/useCancelRequestApproveSolFn";
import { useDepositRewardSolFn } from "./hooks/useDepositRewardSolFn";
import { useDepositBurnSolFn } from "./hooks/useDepositBurnSolFn";
import { userService } from "@/services/userService";
import { useEditPoolEvmFn } from "../hooks/useEditPoolEvmFn";
import { useEditPoolSolFn } from "../hooks/useEditPoolSolFn";
import { useNavigate } from "@tanstack/react-router";

export const useAmountActivity = (poolDetail?: PoolDetailResponse) => {
    const { user } = useAuthStore();
    const { caipAddress } = useAppKitAccount();
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
    const { depositRewardSol } = useDepositRewardSolFn();
    const { depositBurnSol } = useDepositBurnSolFn();

    const { editPool: editPoolEvm } = useEditPoolEvmFn();
    const { editPool: editPoolSol } = useEditPoolSolFn();

    // ── Amount-input state ─────────────────────────────────────
    const [depositRewardOpen, setDepositRewardOpen] = useState(false);
    const [depositBurnOpen, setDepositBurnOpen] = useState(false);
    const [editPoolOpen, setEditPoolOpen] = useState(false);

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

        const hasReward = Number(pool.currentRewardAmount ?? 0) > 0;
        const isPastStartTime =
            pool.timeStart && pool.timeStart !== "0"
                ? Date.now() / 1000 > Number(pool.timeStart)
                : false;

        if (isPastStartTime) {
            toast.warning(
                "Pool already past start time. Please edit pool start time.",
            );
            return;
        }
        if (!hasReward) {
            toast.warning("Pool has no reward. Please deposit reward to pool.");
            return;
        }

        if (isSolana) {
            await requestApproveSol({ poolAddress: pool.address });
        } else {
            await requestApprovePool({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleDepositReward = async (amountStr: string) => {
        if (!pool || !amountStr) return;
        if (isSolana && poolDetail) {
            await depositRewardSol({
                poolAddress: pool.address,
                poolDetail,
                amountStr,
            });
        } else {
            await depositRewardEvm({
                poolAddress: pool.address,
                rewardToken: pool.rewardToken,
                amountStr,
                decimals: pool.rewardTokenDecimals,
            });
        }
        setDepositRewardOpen(false);
        invalidatePoolQueries(pool.address);
    };

    const handleDepositBurn = async (amountStr: string) => {
        if (!pool || !amountStr) return;
        if (isSolana && poolDetail) {
            await depositBurnSol({
                poolAddress: pool.address,
                poolDetail,
                amountStr,
            });
        } else {
            await depositBurnEvm({
                poolAddress: pool.address,
                burnToken: pool.tokenIn,
                amountStr,
                decimals: pool.tokenInDecimals,
            });
        }
        setDepositBurnOpen(false);
        invalidatePoolQueries(pool.address);
    };

    const handleClaim = async () => {
        if (!pool?.address) return;
        try {
            const proof = await userService.getPoolMerkleProof(pool.address);
            if (!proof) {
                toast.error("You are not eligible to claim reward");
                return;
            }
            if (isSolana && poolDetail) {
                await claimBurnSol({
                    poolAddress: pool.address,
                    poolDetail,
                    merkleProof: proof.merkleProof,
                    proofIndex: proof.proofIndex,
                });
            } else {
                await claimBurnReward({
                    poolAddress: pool.address,
                    merkleProof: proof.merkleProof,
                });
            }
            invalidatePoolQueries(pool.address);
        } catch (error) {
            toast.error("Claim reward failed", {
                description: error?.data?.message || undefined,
            });
        }
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

    const handleEdit = async (values: {
        name: string;
        startTime: number;
        endTime: number;
    }) => {
        if (!pool?.address) return;
        if (isSolana && poolDetail) {
            await editPoolSol({
                poolAddress: pool.address,
                poolDetail,
                startTime: values.startTime,
                endTime: values.endTime,
                name: values.name,
            });
        } else {
            await editPoolEvm({
                poolAddress: pool.address,
                name: values.name,
                startTime: values.startTime,
                endTime: values.endTime,
            });
        }
        setEditPoolOpen(false);
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
        depositRewardOpen,
        setDepositRewardOpen,
        // deposit burn dialog
        depositBurnOpen,
        setDepositBurnOpen,
        // action handlers
        handleCancelPool,
        handleRequestApprove,
        handleDepositReward,
        handleDepositBurn,
        handleClaim,
        handleCancelApprovalRequest,
        handleEdit,
        editPoolOpen,
        setEditPoolOpen,
    };
};
