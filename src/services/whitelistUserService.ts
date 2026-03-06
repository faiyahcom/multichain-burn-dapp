import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";

const WHITELIST_USERS_API_ROUTES = API_ROUTES.WHITELIST_USERS;

export interface TokenAllocation {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  chainId: string; // stringified BigInt from backend
  amount: string; // raw BigInt string
}

export interface WhitelistUser {
  address: string;
  name: string;
  email: string;
  enabled: boolean;
  createdAt: string;
  tokenAllocations: TokenAllocation[];
}

export interface ListUsersResponse {
  total: number;
  countEnable: number;
  countDisable: number;
  users: WhitelistUser[];
}

export const whitelistUserService = {
  getListUsers: async (params?: {
    search?: string;
    chainIds?: number[];
    tokenAddresses?: string[];
  }) => {
    const response = await apiClient.get<ListUsersResponse>(
      WHITELIST_USERS_API_ROUTES.GET_LIST_USERS,
      {
        params: {
          search: params?.search,
          chainId: params?.chainIds,
          tokenAddress: params?.tokenAddresses,
        },
        // axios serializes arrays as repeated params: chainId=97&chainId=11155111
        paramsSerializer: { indexes: null },
      },
    );
    return response;
  },

  updateUserInfo: async (data: {
    walletAddress: string;
    name?: string;
    email?: string;
  }) => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name ?? "");
    if (data.email !== undefined) formData.append("email", data.email ?? "");

    const response = await apiClient.post(
      WHITELIST_USERS_API_ROUTES.UPDATE_USER_INFO(data.walletAddress),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response;
  },
};
