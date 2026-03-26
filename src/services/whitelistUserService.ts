import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type { PaginationResponse } from "@/types/common";

const WHITELIST_USERS_API_ROUTES = API_ROUTES.WHITELIST_USERS;

export interface TokenAllocation {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  chainId: string; // stringified BigInt from backend
  amount: string; // raw BigInt string
  customName: string | null;
  customSymbol: string | null;
}

export interface WhitelistUser {
  address: string;
  name: string;
  email: string;
  /** Whether this user is whitelisted on this chain */
  whitelisted: boolean;
  /** Whether this user is enabled on this chain */
  enable: boolean;
  /** The chain ID this user belongs to (stringified) */
  chainId: string;
  createdAt: string;
  tokenAllocations: TokenAllocation[];
}

export interface ListUsersResponse {
  total: number;
  countEnable: number;
  countDisable: number;
  users: WhitelistUser[];
}

export interface TransferHistoryAnalysisItem {
  chainId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalAmount: string;
  txnCount: number;
  tokenCustomName: string | null;
  tokenCustomSymbol: string | null;
}

export interface TransferHistoryAnalysisResponse {
  analysis: TransferHistoryAnalysisItem[];
}

export interface TransferHistoryRequest {
  page: number;
  limit: number;
  search?: string;
  chainId?: string;
  tokenOut?: string;
  amountOutMin?: string;
  amountOutMax?: string;
  dateFrom?: number; //timestamp ms
  dateTo?: number; //timestamp ms
}

type TransferHistoryApiTxn = {
  id: string;
  hash: string;
  recipient: string | null;
  poolAddress: string;
  poolName: string | null;
  chainId: string;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals?: number;
  amountOut: string;
  timestamp: string; // unix seconds (as string)
  whitelistName: string | null;
  whitelistEmail: string | null;
  tokenOutCustomName: string | null;
  tokenOutCustomSymbol: string | null;
};

export interface TransferHistoryResponse extends PaginationResponse {
  txns: TransferHistoryApiTxn[];
}

export interface CheckUserResponse {
  address: string;
  whitelisted: boolean;
  [key: string]: unknown;
}

export const whitelistUserService = {
  checkUser: async (params: { walletAddress: string; chainId: string }) => {
    const response = await apiClient.get<CheckUserResponse>(
      WHITELIST_USERS_API_ROUTES.CHECK_USER,
      {
        params: {
          walletAddress: params.walletAddress,
          chainId: params.chainId,
        },
      },
    );
    return response;
  },

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
          chainIds: params?.chainIds,
          // comma-separated: tokenAddresses=addr1,addr2,addr3
          tokenAddresses: params?.tokenAddresses?.length
            ? params.tokenAddresses.join(",")
            : undefined,
        },
        // axios serializes arrays as repeated params: chainIds=97&chainIds=11155111
        paramsSerializer: { indexes: null },
      },
    );
    return response;
  },

  updateUserInfo: async (data: {
    walletAddress: string;
    chainId: string;
    name?: string;
    email?: string;
  }) => {
    const formData = new FormData();
    if (data.name !== undefined) formData.append("name", data.name ?? "");
    if (data.email !== undefined) formData.append("email", data.email ?? "");

    const response = await apiClient.post(
      WHITELIST_USERS_API_ROUTES.UPDATE_USER_INFO(data.walletAddress, data.chainId),
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response;
  },

  getAnalysis: async () => {
    const response = await apiClient.get<TransferHistoryAnalysisResponse>(
      WHITELIST_USERS_API_ROUTES.ANALYSIS,
    );
    return response;
  },

  getTransferHistory: async (params: TransferHistoryRequest) => {
    const response = await apiClient.get<TransferHistoryResponse>(
      WHITELIST_USERS_API_ROUTES.HISTORY,
      {
        params,
      },
    );
    return response;
  },
};
