import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import { activityKind } from "@/types/pool";

export interface TokenAmount {
  chainId: string;
  token: string;
  symbol: string;
  decimals: number;
  amount: string;
}

export interface SectionStats {
  volume: TokenAmount[];
  totalTxns: number;
  totalParticipants: number;
  totalPools: number;
}

export interface StatsStickerResponse {
  tvl: TokenAmount[];
  volume: TokenAmount[];
  totalTxns: number;
  totalActivities: number;
  totalPools: number;
  burnSection: SectionStats;
  swapSection: SectionStats;
}

export interface ActivityItem {
  id: string;
  hash: string;
  log_ix: number;
  kind: keyof typeof activityKind;
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
  poolKind: number;
  recipient: string;
  executor: string;
  executorName: string | null;
  tokenInCustomName: string | null;
  tokenInCustomSymbol: string | null;
  tokenInImage: string | null;
  tokenOutCustomName: string | null;
  tokenOutCustomSymbol: string | null;
  tokenOutImage: string | null;
  pool?: {
    name: string | null;
  };
  fee?: string;
}

export interface LatestActivityResponse {
  burnActivities: ActivityItem[];
  swapActivities: ActivityItem[];
  transactions: ActivityItem[];
}

export interface PartnerPool {
  name: string;
  address: string;
  chainId: string;
  rewardAmount: string;
  tokenIn: string;
  tokenInSymbol: string;
  tokenInDecimals: number;
  tokenInSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals: number;
  tokenOutSymbolCustom: string | null;
  tokenOutImageUri: string | null;
  timeStart: string;
  timeEnd: string;
  status: string;
  totalParticipants: number;
}

export interface PartnerPoolsResponse {
  total: number;
  page: number;
  partnerPools: PartnerPool[];
}

export interface TopPair {
  chainId: string;
  volume: string;
  tvl: string;
  liquidity: string;
  tokenIn: string;
  tokenInSymbol: string;
  tokenInDecimals: number;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals: number;
  tokenInSymbolCustom: string | null;
  tokenOutSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOutImageUri: string | null;
}

export interface TopPairResponse {
  topPair: TopPair[];
}

export interface TopSwapper {
  address: string;
  chainId: string;
  name: string | null;
  avatar: string | null;
  totalSwapTxns: number;
  totalJoinedSwapPools: number;
}

export interface TopSwapperResponse {
  topSwapper: TopSwapper[];
}

export interface LimitRequest {
  limit?: number;
  page?: number;
}

export const dashboardService = {
  getStatsSticker: async () => {
    const response = await apiClient.get<StatsStickerResponse>(
      API_ROUTES.GENERAL.STATS_STICKER,
    );
    return response;
  },

  getLatestActivity: async () => {
    const response = await apiClient.get<LatestActivityResponse>(
      API_ROUTES.GENERAL.LATEST_ACTIVITY,
    );
    return response;
  },

  getPartnerPools: async (params?: LimitRequest) => {
    const response = await apiClient.get<PartnerPoolsResponse>(
      API_ROUTES.GENERAL.PARTNER_POOLS,
      { params },
    );
    return response;
  },

  getTopPair: async (params?: LimitRequest) => {
    const response = await apiClient.get<TopPairResponse>(
      API_ROUTES.GENERAL.TOP_PAIR,
      { params },
    );
    return response;
  },

  getTopSwapper: async (params?: LimitRequest) => {
    const response = await apiClient.get<TopSwapperResponse>(
      API_ROUTES.GENERAL.TOP_SWAPPER,
      { params },
    );
    return response;
  },
};
