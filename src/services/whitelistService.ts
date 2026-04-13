import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type { BooleanString, PaginationResponse } from "@/types/common";
const WHITELIST_API_ROUTES = API_ROUTES.WHITELIST;

export interface WhitelistToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  enable: boolean;
  chainId: string;
  imageUri: string;
  customName: string;
  customSymbol: string;
  description: string;
  homepage: string;
  whitepaper: string;
  createdAt: string;
  kind: { enable: boolean; kind: number }[];
}

export interface ListTokensRequest {
  page?: number;
  limit?: number;
  active?: BooleanString;
  isDropped?: BooleanString; // soft delete
  chainIds?: string; // comma separated
  search?: string;
  kinds?: string; // comma separated pool type numbers
  minDecimals?: number;
  maxDecimals?: number;
}

export interface ListTokensResponse extends PaginationResponse {
  whitelistTokens: WhitelistToken[];
  totalDisable: number;
  totalEnable: number;
}

export interface CreateWhitelistTokenResponse {
  imageUri?: string;
}

export interface ForceUpdateWhitelistTokenStatusRequest {
  chainId: string;
  address: string;
  active: boolean;
  kind: number;
}

export interface ForceUpdateWhitelistTokenStatusResponse {
  newStatus: boolean;
}

export interface DeleteWhitelistTokenRequest {
  chainId: string;
  address: string;
}

export interface UpdateWhitelistTokenRequest {
  chainId: string;
  address: string;
  data: FormData;
}

export const whitelistService = {
  getListTokens: async (request?: ListTokensRequest) => {
    const response = await apiClient.get<ListTokensResponse>(
      `${WHITELIST_API_ROUTES.GET_LIST_TOKENS}`,
      {
        params: {
          ...request,
          page: request?.page || 1,
          limit: request?.limit || 100,
        },
      },
    );
    return response;
  },

  // This will overwrite the existing token if the address is already whitelisted
  createWhitelistToken: async (data: FormData) => {
    const response = await apiClient.post<CreateWhitelistTokenResponse>(
      `${WHITELIST_API_ROUTES.CREATE_WHITELIST_TOKEN}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response;
  },

  // The token status is already updated with the SC event
  // This is in the case of the update is too slow
  updateStatusWhitelistTokenStatus: async (
    request: ForceUpdateWhitelistTokenStatusRequest,
  ) => {
    const response =
      await apiClient.post<ForceUpdateWhitelistTokenStatusResponse>(
        `${WHITELIST_API_ROUTES.UPDATE_STATUS_WHITELIST_TOKEN_STATUS(
          request.chainId,
          request.address,
        )}`,
        {
          active: request.active,
          kind: request.kind,
        },
      );

    return response;
  },

  // soft delete
  deleteWhitelistToken: async (request: DeleteWhitelistTokenRequest) => {
    const response = await apiClient.delete<void>(
      `${WHITELIST_API_ROUTES.DELETE_WHITELIST_TOKEN(
        request.chainId,
        request.address,
      )}`,
    );

    return response;
  },

  updateWhitelistToken: async (request: UpdateWhitelistTokenRequest) => {
    const response = await apiClient.patch<WhitelistToken>(
      `${WHITELIST_API_ROUTES.UPDATE_WHITELIST_TOKEN(
        request.chainId,
        request.address,
      )}`,
      request.data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response;
  },
};
