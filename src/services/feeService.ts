import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type { PaginationResponse } from "@/types/common";

// ─── Fee list types ───────────────────────────────────────────────────────────

export interface FeeRecord {
    timestamp: string;
    poolAddress: string;
    executorAddress: string;
    chainId: string;
    hash: string;
    token: string;
    tokenDecimals: number;
    tokenSymbol: string;
    amount: string;
    pool: {
        name: string;
    };
    executor: {
        name: string;
    };
}

export interface GetFeeListRequest {
    page: number;
    limit: number;
    chainId: string;
    from?: string;
    to?: string;
    kinds?: string; // string arrays split by comma, e.g. "1,2" for creation fees, "3,4" for settlement fees
}

export interface GetStatsRequest {
    chainId?: string;
    from?: string;
    to?: string;
}

export interface GetFeeListResponse extends PaginationResponse {
    txns: FeeRecord[];
}

// ─── Fee stats types ──────────────────────────────────────────────────────────

export interface SettlementFeeItem {
    token_address: string;
    symbol: string;
    decimals: number;
    amount: string;
    custom_symbol: string | null;
    custom_name: string | null;
    image_uri: string | null;
}

export interface GetFeeStatsResponse {
    create_fee: string;
    settlement_fees: SettlementFeeItem[];
}

export const feeTxnKind = {
    createBurnPool: 1, // creation fee
    createSwapPool: 2, // creation fee
    claimBurnReward: 3, // settlement fee
    swap: 4 // settlement fee
} as const

// ─── Service ──────────────────────────────────────────────────────────────────

export const feeService = {
    getList: async (params: GetFeeListRequest): Promise<GetFeeListResponse> => {
        const response = await apiClient.get<GetFeeListResponse>(
            API_ROUTES.FEE.LIST,
            { params },
        );
        return response;
    },

    getStats: async (params?: GetStatsRequest): Promise<GetFeeStatsResponse> => {
        const response = await apiClient.get<GetFeeStatsResponse>(
            API_ROUTES.FEE.STATS,
            { params },
        );
        return response;
    },
};
