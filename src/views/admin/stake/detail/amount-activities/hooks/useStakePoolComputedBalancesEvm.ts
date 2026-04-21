import { useCallback, useMemo } from "react";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { formatAmount } from "@/utils/helpers/numbers";

const STAKING_POOL_VIEW_ABI = [
  {
    inputs: [],
    name: "totalReward",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardDebtTotal",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalStaked",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const normalizeAddress = (value?: string) => value?.trim().toLowerCase();

type Params = {
  poolAddress?: string;
  chainId?: string;
  rewardToken?: string;
  tokenIn?: string;
  rewardTokenDecimals?: number;
  tokenInDecimals?: number;
  enabled?: boolean;
};

export const useStakePoolComputedBalancesEvm = ({
  poolAddress,
  chainId,
  rewardToken,
  tokenIn,
  rewardTokenDecimals,
  tokenInDecimals,
  enabled = true,
}: Params) => {
  const numericChainId = chainId ? Number(chainId) : undefined;
  const queryEnabled =
    enabled &&
    !!poolAddress &&
    numericChainId !== undefined &&
    Number.isFinite(numericChainId);

  const sharedConfig = {
    address: poolAddress as Address | undefined,
    abi: STAKING_POOL_VIEW_ABI,
    chainId: numericChainId,
    query: {
      enabled: queryEnabled,
      refetchInterval: 30_000,
    },
  } as const;

  const {
    data: totalReward,
    isLoading: isLoadingTotalReward,
    refetch: refetchTotalReward,
  } = useReadContract({
    ...sharedConfig,
    functionName: "totalReward",
  });

  const {
    data: rewardDebtTotal,
    isLoading: isLoadingRewardDebtTotal,
    refetch: refetchRewardDebtTotal,
  } = useReadContract({
    ...sharedConfig,
    functionName: "rewardDebtTotal",
  });

  const {
    data: totalStaked,
    isLoading: isLoadingTotalStaked,
    refetch: refetchTotalStaked,
  } = useReadContract({
    ...sharedConfig,
    functionName: "totalStaked",
  });

  const isSameToken =
    !!rewardToken &&
    !!tokenIn &&
    normalizeAddress(rewardToken) === normalizeAddress(tokenIn);

  const currentRewardAmountRaw = useMemo(() => {
    if (totalReward === undefined || rewardDebtTotal === undefined) return undefined;
    return totalReward - rewardDebtTotal;
  }, [rewardDebtTotal, totalReward]);

  const currentDepositAmountRaw = useMemo(() => {
    if (
      totalReward === undefined ||
      totalStaked === undefined ||
      currentRewardAmountRaw === undefined
    )
      return undefined;

    if (isSameToken) {
      return currentRewardAmountRaw < 0n ? totalStaked + totalReward : totalStaked;
    }

    return totalStaked;
  }, [currentRewardAmountRaw, isSameToken, totalReward, totalStaked]);

  const formattedCurrentRewardAmount = useMemo(() => {
    if (
      currentRewardAmountRaw === undefined ||
      rewardTokenDecimals === undefined
    )
      return undefined;

    return formatAmount(currentRewardAmountRaw.toString(), rewardTokenDecimals);
  }, [currentRewardAmountRaw, rewardTokenDecimals]);

  const formattedCurrentDepositAmount = useMemo(() => {
    if (
      currentDepositAmountRaw === undefined ||
      tokenInDecimals === undefined
    )
      return undefined;

    return formatAmount(currentDepositAmountRaw.toString(), tokenInDecimals);
  }, [currentDepositAmountRaw, tokenInDecimals]);

  const refetch = useCallback(async () => {
    await Promise.all([
      refetchTotalReward(),
      refetchRewardDebtTotal(),
      refetchTotalStaked(),
    ]);
  }, [refetchRewardDebtTotal, refetchTotalReward, refetchTotalStaked]);

  return {
    isLoading:
      isLoadingTotalReward || isLoadingRewardDebtTotal || isLoadingTotalStaked,
    isSameToken,
    totalRewardRaw: totalReward?.toString(),
    rewardDebtTotalRaw: rewardDebtTotal?.toString(),
    totalStakedRaw: totalStaked?.toString(),
    currentRewardAmountRaw:
      currentRewardAmountRaw !== undefined
        ? currentRewardAmountRaw.toString()
        : undefined,
    currentDepositAmountRaw:
      currentDepositAmountRaw !== undefined
        ? currentDepositAmountRaw.toString()
        : undefined,
    formattedCurrentRewardAmount,
    formattedCurrentDepositAmount,
    refetch,
  };
};
