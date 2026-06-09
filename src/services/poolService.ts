import { apiClient } from "@/config/axios";
import { API_BASE_URL } from "@/config/constant";
import { API_ROUTES } from "@/services/apiRoutes";
import { useAuthStore } from "@/stores/authStore";
import type {
  PoolListRequest,
  PoolListResponse,
} from "@/types/admin/master-pool-management";
import type {
  PoolActivitiesResponse,
  PoolDetailResponse,
  PoolTxnsResponse,
} from "@/types/pool";
const POOLS_API_ROUTES = API_ROUTES.POOLS;
const ADMINS_API_ROUTES = API_ROUTES.ADMINS;

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
  togglePartnerPool: async (address: string, isPartner: boolean) => {
    const response = await apiClient.patch(
      `${POOLS_API_ROUTES.TOGGLE_PARTNER_POOL(address)}`,
      {
        isPartner,
      },
    );
    return response;
  },
  /**
   * Downloads the transaction history for a pool as an Excel file.
   * Uses a direct fetch (not apiClient) so we can handle a binary blob response.
   */
  exportPoolTxns: async (
    address: string,
    excludeKinds?: string,
  ): Promise<void> => {
    const params = new URLSearchParams();
    if (excludeKinds) params.set("excludeKinds", excludeKinds);
    params.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
    const query = `?${params.toString()}`;
    const url = `${API_BASE_URL}${ADMINS_API_ROUTES.TXNS_EXPORT(address)}${query}`;

    const accessToken = useAuthStore.getState().accessToken;
    const res = await fetch(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        Accept: "*/*",
      },
    });

    if (!res.ok) throw new Error(`Export failed: ${res.status}`);

    const blob = await res.blob();
    const disposition = res.headers.get("content-disposition") ?? "";
    const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1] ?? `txn-history-${address}.xlsx`;

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  },
};
