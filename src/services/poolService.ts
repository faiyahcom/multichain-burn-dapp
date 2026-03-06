import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  PoolActivitiesResponse,
  PoolDetailResponse,
  PoolTxnsResponse,
} from "@/types/pool";
const POOLS_API_ROUTES = API_ROUTES.POOLS;

export const poolService = {
  getPoolDetail: async (address: string) => {
    const response = await apiClient.get<PoolDetailResponse>(
      `${POOLS_API_ROUTES.GET_POOL_DETAIL(address)}`,
    );
    return response;
  },
  getPoolTxns: async (page: number, limit: number, address: string) => {
    const response = await apiClient.get<PoolTxnsResponse>(
      `${POOLS_API_ROUTES.GET_POOL_TXNS(address)}?page=${page}&limit=${limit}`,
    );
    return response;
  },
  getPoolActivities: async (page: number, limit: number, address: string) => {
    const response = await apiClient.get<PoolActivitiesResponse>(
      `${POOLS_API_ROUTES.GET_POOL_ACTIVITIES(address)}?page=${page}&limit=${limit}`,
    );
    return response;
  },
};
