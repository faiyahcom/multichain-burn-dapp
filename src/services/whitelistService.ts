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
}

export interface ListTokensRequest {
  page?: number;
  limit?: number;
  active?: BooleanString;
  isDropped?: BooleanString; // soft delete
  chainIds?: string; // comma separated
  search?: string;
}

export interface ListTokensResponse extends PaginationResponse {
  whitelistTokens: WhitelistToken[];
}

export interface CreateWhitelistTokenResponse {
  imageUri?: string;
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
};
