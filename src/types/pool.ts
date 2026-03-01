export type PoolStatus = "on_going" | "canceled" | "closed";

export interface PoolDetailResponse {
    totalDeposited: string;
    totalRewardAmount: string;
    pool: {
        address: string;
        name: string;
        owner: string;
        rewardToken: string;
        kind: number;
        chainId: string;
        timestamp: string;
        status: PoolStatus;
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
    txns: {
        id: string;
        hash: string;
        log_ix: number;
        kind: number;
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