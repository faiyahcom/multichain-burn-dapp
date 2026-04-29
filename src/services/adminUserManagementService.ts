import { apiClient } from "@/config/axios";
import type { PaginationRequest, PaginationResponse } from "@/types/common";
import { API_ROUTES } from "./apiRoutes";

export type UserType = {
  address: string;
  name: string;
  chainId: string;
  joinedDate: string; // ISO string
};

export interface AdminUserManagementListRequest extends PaginationRequest {
  chainIds?: string; // comma-separated
  joinedFrom?: number; // unix seconds
  joinedTo?: number; // unix seconds
  search?: string;
}

export interface AdminUserManagementListResponse extends PaginationResponse {
  users: UserType[];
}

export const adminUserManagementService = {
  getList: async (
    params?: AdminUserManagementListRequest,
  ): Promise<AdminUserManagementListResponse> => {
    const response = await apiClient.get<AdminUserManagementListResponse>(
      API_ROUTES.ADMINS.USER_LIST,
      {
        params,
      },
    );

    return response;
  },
};
