import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { PoolDetailResponse } from "@/types/pool";
import { poolQueryKeys } from "@/services/queries/queryKey";

import { useSubmitPoolSolFn } from "./hooks/useSubmitPoolSolFn";
import { useSubmitPoolEvmFn } from "./hooks/useSubmitPoolEvmFn";
import { useCancelPoolSolFn } from "./hooks/useCancelPoolSolFn";
import { useCancelPoolEvmFn } from "./hooks/useCancelPoolEvmFn";
import { useEmergencyCloseSolFn } from "./hooks/useEmergencyCloseSolFn";
import { useEmergencyCloseEvmFn } from "./hooks/useEmergencyCloseEvmFn";
import { useDepositRewardSolFn } from "./hooks/useDepositRewardSolFn";
import { useDepositRewardEvmFn } from "./hooks/useDepositRewardEvmFn";
import { poolService } from "@/services/poolService";

export const useAmountActivity = (poolDetail?: PoolDetailResponse) => {
    const { caipAddress } = useAppKitAccount();
    const namespace = caipAddress?.split(":")[0];
    const isSolana = namespace === "solana";
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // ── SC hooks ───────────────────────────────────────────────
    const { submitPoolSol } = useSubmitPoolSolFn();
    const { submitPoolEvm } = useSubmitPoolEvmFn();
    const { cancelPoolSol } = useCancelPoolSolFn();
    const { cancelPoolEvm } = useCancelPoolEvmFn();
    const { emergencyCloseSol } = useEmergencyCloseSolFn();
    const { emergencyCloseEvm } = useEmergencyCloseEvmFn();
    const { depositRewardSol } = useDepositRewardSolFn();
    const { depositRewardEvm } = useDepositRewardEvmFn();

    // ── UI state ───────────────────────────────────────────────
    const [depositRewardInput, setDepositRewardInput] = useState("");
    const [depositRewardOpen, setDepositRewardOpen] = useState(false);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);

    const pool = poolDetail?.pool;
    const status = pool?.status;

    // ── Query invalidation ─────────────────────────────────────
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

    const handleSubmitPool = async () => {
        if (!pool?.address) return;
        if (isSolana) {
            await submitPoolSol({ poolAddress: pool.address });
        } else {
            await submitPoolEvm({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleCancelPool = async () => {
        if (!pool?.address || !poolDetail) return;
        if (isSolana) {
            await cancelPoolSol({ poolAddress: pool.address, poolDetail });
        } else {
            await cancelPoolEvm({ poolAddress: pool.address });
        }
        invalidatePoolQueries(pool.address);
    };

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
        invalidatePoolQueries(pool.address);
    };

    const handleDepositReward = async () => {
        if (!pool || !depositRewardInput) return;
        if (isSolana && poolDetail) {
            await depositRewardSol({
                poolAddress: pool.address,
                poolDetail,
                amountStr: depositRewardInput,
            });
        } else {
            await depositRewardEvm({
                poolAddress: pool.address,
                rewardToken: pool.rewardToken,
                amountStr: depositRewardInput,
                decimals: pool.rewardTokenDecimals,
            });
        }
        setDepositRewardInput("");
        setDepositRewardOpen(false);
        invalidatePoolQueries(pool.address);
    };

    const handleDepositRewardWithAmount = async (amountStr: string) => {
        if (!pool) return;
        if (isSolana && poolDetail) {
            await depositRewardSol({ poolAddress: pool.address, poolDetail, amountStr });
        } else {
            await depositRewardEvm({
                poolAddress: pool.address,
                rewardToken: pool.rewardToken,
                amountStr,
                decimals: pool.rewardTokenDecimals,
            });
        }
        invalidatePoolQueries(pool.address);
    };

    const handleEdit = () => {
        if (!pool?.address) return;
        navigate({
            to: "/admin/stake/edit/$address",
            params: { address: pool.address },
        });
    };

    return {
        pool,
        status,
        // deposit reward input
        depositRewardInput,
        setDepositRewardInput,
        depositRewardOpen,
        setDepositRewardOpen,
        // transfer dialog
        transferDialogOpen,
        setTransferDialogOpen,
        // action handlers
        handleSubmitPool,
        handleCancelPool,
        handleEmergencyClose,
        handleDepositReward,
        handleDepositRewardWithAmount,
        handleEdit,
        // util
        invalidatePoolQueries,
    };
};
