import { apiClient } from "@/config/axios";
import type { PairListRequest, PairListResponse } from "@/types/pair";
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
};
