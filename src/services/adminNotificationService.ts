import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  MarkReadRequest,
  MarkReadResponse,
  NotificationsListResponse,
  ToggleLowRewardNotiRequest,
  ToggleLowRewardNotiResponse,
} from "@/types/notification";

export interface GetAdminNotificationsParams {
  page?: number;
  limit?: number;
}

export const adminNotificationService = {
  getList: async (
    params: GetAdminNotificationsParams,
  ): Promise<NotificationsListResponse> => {
    const response = await apiClient.get<NotificationsListResponse>(
      API_ROUTES.ADMINS.NOTIFICATIONS.LIST,
      { params },
    );
    return response;
  },

  markRead: async (body: MarkReadRequest): Promise<MarkReadResponse> => {
    const response = await apiClient.post<MarkReadResponse>(
      API_ROUTES.ADMINS.NOTIFICATIONS.MARK_READ,
      body,
    );
    return response;
  },

  toggleLowRewardNoti: async (
    request: ToggleLowRewardNotiRequest,
  ): Promise<ToggleLowRewardNotiResponse> => {
    const response = await apiClient.patch<ToggleLowRewardNotiResponse>(
      `${API_ROUTES.ADMINS.TOGGLE_LOW_REWARD_NOTI(request.poolAddress)}`,
      {
        enabled: request.enabled,
      },
    );
    return response;
  },
};
