import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  MarkReadRequest,
  MarkReadResponse,
  NotiItem,
  NotificationsListResponse,
} from "@/types/notification";

export type { NotiItem, NotificationsListResponse, MarkReadRequest };

export interface GetNotificationsParams {
  page: number;
  limit: number;
}

export interface GetNotificationsResult {
  total: number;
  page: number;
  notis: NotiItem[];
  unread: number;
}

export const notificationService = {
  getList: async (
    params: GetNotificationsParams,
  ): Promise<GetNotificationsResult> => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    const response = await apiClient.get<NotificationsListResponse>(
      `${API_ROUTES.NOTIFICATIONS.LIST}?${query.toString()}`,
    );
    return response
  },

  markRead: async (body: MarkReadRequest): Promise<MarkReadResponse> => {
    return apiClient.post<MarkReadResponse>(
      API_ROUTES.NOTIFICATIONS.MARK_READ,
      body,
    );
  },
};
