import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  PoolListRequest,
  PoolListResponse,
  PoolListStatsResponse,
  RecentPoolsResponse,
} from "@/types/admin/master-pool-management";
import type {
  PoolActivitiesResponse,
  PoolDetailResponse,
  PoolKindCode,
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
  getPoolTxns: async (
    page: number,
    limit: number,
    address: string,
    excludeKinds?: string,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (excludeKinds) params.set("excludeKinds", excludeKinds);
    const response = await apiClient.get<PoolTxnsResponse>(
      `${POOLS_API_ROUTES.GET_POOL_TXNS(address)}?${params.toString()}`,
    );
    return response;
  },
  getPoolActivities: async (
    page: number,
    limit: number,
    address: string,
    excludeKinds?: string,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (excludeKinds) params.set("excludeKinds", excludeKinds);
    const response = await apiClient.get<PoolActivitiesResponse>(
      `${POOLS_API_ROUTES.GET_POOL_ACTIVITIES(address)}?${params.toString()}`,
    );
    return response;
  },
  getPoolList: async (request: PoolListRequest) => {
    const response = await apiClient.get<PoolListResponse>(
      `${POOLS_API_ROUTES.LIST}`,
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
  postReasonClosePool: async (address: string, reason: string) => {
    const response = await apiClient.post(
      `${POOLS_API_ROUTES.REASON_CLOSE_POOL(address)}`,
      {
        reason,
      },
    );
    return response;
  },
  getPoolStats: async (poolKind: PoolKindCode) => {
    const response = await apiClient.get<PoolListStatsResponse>(
      `${POOLS_API_ROUTES.STATS}`,
      {
        params: {
          poolKind,
        },
      },
    );
    return response;
  },
  getRecentPools: async (poolKind: PoolKindCode) => {
    const response = await apiClient.get<RecentPoolsResponse>(
      `${POOLS_API_ROUTES.RECENT_POOLS}`,
      {
        params: {
          poolKind,
        },
      },
    );
    return response;
  },
};
