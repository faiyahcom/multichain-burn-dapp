import { apiClient } from "@/config/axios";
import type {
  PairDetailStatsRequest,
  PairDetailStatsResponse,
  PairListRequest,
  PairListResponse,
  PairOverallStatsResponse,
} from "@/types/pair";
import { API_ROUTES } from "./apiRoutes";

const PAIRS_API_ROUTES = API_ROUTES.PAIRS;

export const pairService = {
  getPairList: async (request: PairListRequest) => {
    const response = await apiClient.get<PairListResponse>(
      `${PAIRS_API_ROUTES.LIST}`,
      {
        params: {
          ...request,
          page: request.page ?? 1,
          limit: request.limit ?? 100,
        },
      },
    );

    return response;
  },

  getPairStats: async (request: PairDetailStatsRequest) => {
    const { chainId, ...rest } = request;
    const response = await apiClient.get<PairDetailStatsResponse>(
      `${PAIRS_API_ROUTES.STATS(chainId)}`,
      {
        params: rest,
      },
    );

    return response;
  },

  getPairOverallStats: async () => {
    const response = await apiClient.get<PairOverallStatsResponse>(
      `${PAIRS_API_ROUTES.OVERALL_STATS}`,
    );

    return response;
  },
};
