export type SwapPoolStatus = "on_going" | "canceled" | "closed" | "draft";
export type BurnPoolStatus = "on_going" | "canceled" | "closed" | "draft" | "pending" | "upcoming" | "holding" | "end";
export type PoolKind = "burn_pool" | "swap_pool";
export const POOL_KIND: Record<number, PoolKind> = {
    0: "burn_pool",
    1: "swap_pool",
};

export interface PoolDetailResponse {
    userAmount: {
        address: string;
        deposited: string;
        claimed: string;
    };
    depositedAmount: string;
    claimedRewardAmount: string;
    rewardAmount: string;
    pool: {
        address: string;
        name: string;
        owner: string;
        rewardToken: string;
        kind: number;
        chainId: string;
        timestamp: string;
        status: SwapPoolStatus | BurnPoolStatus;
        currentRewardAmount: string;
        rewardTokenSymbol: string;
        rewardTokenDecimals: number;
        tokenInSymbol: string;
        tokenInDecimals: number;
        burnToken: string;
        targetVault: string;
        timeStart: string;
        timeEnd: string;
        tokenIn: string;
        targetAddress: string;
        assetTypeReward: number;
        assetTypeIn: number;
        rewardNumerator: string;
        rewardDenominator: string;
        rewardAmount: string;
        settlementFee: string;
        poolCreationFee: string;
    };
}

export interface PoolTxnsResponse {
    page: number;
    total: number;
    txns: {
        id: string;
        hash: string;
        log_ix: number;
        kind: keyof typeof txnKind;
        timestamp: string;
        tokenIn: string;
        tokenInSymbol: string;
        tokenInDecimals: number;
        amountIn: string;
        tokenOut: string;
        tokenOutSymbol: string;
        tokenOutDecimals: number;
        amountOut: string;
        chainId: string;
        poolAddress: string;
    }[];
}

export const txnKind = {
    1: "Taker Deposit",
    2: "Refund to Whitelist User",
    3: "Maker Deposit Reward",
    4: "Taker Claim Reward"
} as const;

export const activityKind = {
    // Pool lifecycle
    0: "Pool Created",
    1: "Pool Requested",
    2: "Pool Approved",
    3: "Pool Rejected",
    4: "Pool Canceled",
    5: "Pool Closed",
    8: "Pool Updated",

    // Reward
    10: "Reward Deposited",

    // Admin action
    20: "Admin Refund",

    // User actions
    30: "Taker Deposit", //taker deposit to pool
    31: "Taker Claim" //taker claim reward from burn pool
} as const

export interface PoolActivitiesResponse {
    page: number;
    total: number;
    activities: {
        id: string;
        hash: string;
        log_ix: number;
        timestamp: string;
        actor: string;
        kind: typeof activityKind[keyof typeof activityKind];
        poolAddress: string;
    }[];
}