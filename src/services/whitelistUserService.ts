import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";

const WHITELIST_USERS_API_ROUTES = API_ROUTES.WHITELIST_USERS;

export interface WhitelistUser {
    address: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface ListUsersResponse {
    total: number;
    countEnable: number;
    countDisable: number;
    users: WhitelistUser[];
}

export const whitelistUserService = {
    getListUsers: async (params?: { search?: string }) => {
        const response = await apiClient.get<ListUsersResponse>(
            WHITELIST_USERS_API_ROUTES.GET_LIST_USERS,
            { params },
        );
        return response;
    },
};
