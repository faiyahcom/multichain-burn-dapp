import { apiClient } from "@/config/axios";
import { API_ROUTES } from "./apiRoutes";

interface AdminStatsResponse {
  totalUsers: number;
  newUsersToday: number;
  totalPairs: number;
  totalBurnPools: number;
  totalSwapPools: number;
  totalStakingPools: number;
}

export const adminStatsService = {
  getStats: async (): Promise<AdminStatsResponse> => {
    const response = await apiClient.get<AdminStatsResponse>(
      API_ROUTES.ADMINS.STATS,
    );
    return response;
  },
};
