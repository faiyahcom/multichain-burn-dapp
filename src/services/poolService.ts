import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
const POOLS_API_ROUTES = API_ROUTES.POOLS;

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
    txns: any[];
}

export const poolService = {
    getPoolDetail: async (address: string) => {
        const response = await apiClient.get<PoolDetailResponse>(
            `${POOLS_API_ROUTES.GET_POOL_DETAIL(address)}`,
        );
        return response;
    },
    getPoolTxns: async (address: string) => {
        const response = await apiClient.get<PoolTxnsResponse>(
            `${POOLS_API_ROUTES.GET_POOL_TXNS(address)}`,
        );
        return response;
    },
};
