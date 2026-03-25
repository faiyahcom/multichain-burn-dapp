import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";

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

export const dashboardService = {
  getStatsSticker: async () => {
    const response = await apiClient.get<StatsStickerResponse>(
      API_ROUTES.GENERAL.STATS_STICKER,
    );
    return response;
  },
};
