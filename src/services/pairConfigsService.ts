import { apiClient } from "@/config/axios";
import { API_ROUTES } from "./apiRoutes";
import type { BooleanString, PaginationResponse } from "@/types/common";

export interface PairConfig {
  chainId: number;
  tokenIn: string;
  tokenInName: string;
  tokenInSymbol: string;
  tokenInCustomName: string | null;
  tokenInCustomSymbol: string | null;
  tokenInDisplayName: string;
  tokenInDisplaySymbol: string;
  tokenInImageUri: string | null;
  tokenInWhitelistEnable: boolean;
  tokenInDropped: boolean;
  tokenOut: string;
  tokenOutName: string;
  tokenOutSymbol: string;
  tokenOutCustomName: string | null;
  tokenOutCustomSymbol: string | null;
  tokenOutDisplayName: string;
  tokenOutDisplaySymbol: string;
  tokenOutImageUri: string | null;
  tokenOutWhitelistEnable: boolean;
  tokenOutDropped: boolean;
  ratioNumerator: string;
  ratioDenominator: string;
  ratio: string;
  enable: boolean;
  createdAt: string; // string timestamp
  updatedAt: string; // string timestamp
  createdBy: string; // address
  updatedBy: string; // address
}

export interface PairConfigCreateRequest {
  tokenIn: string;
  tokenOut: string;
  ratioNumerator: string;
  ratioDenominator: string;
  enable: boolean;
}

export interface PairConfigCreateResponse {
  pairConfig: PairConfig;
}

export interface PairConfigUpdateRequest {
  tokenIn: string;
  tokenOut: string;
  ratioNumerator: string;
  ratioDenominator: string;
  enable: boolean;
}

export interface PairConfigUpdateResponse {
  pairConfig: PairConfig;
}

export interface PairConfigListRequest {
  page: number;
  limit: number;
  chainId?: string;
  active?: BooleanString;
  search?: string;
  minRatio?: string;
  maxRatio?: string;
}

export interface PairConfigListResponse extends PaginationResponse {
  totalEnable: number;
  totalDisable: number;
  pairConfigs: PairConfig[];
}

export interface PairConfigDetailRequest {
  chainId: string;
  tokenIn: string;
  tokenOut: string;
}

export interface PairConfigDetailResponse {
  pairConfig: PairConfig;
}

export interface PairConfigDeleteRequest {
  tokenIn: string;
  tokenOut: string;
}

export interface PairConfigDeleteResponse {
  pairConfig: PairConfig;
}

export const pairConfigsService = {
  createPairConfig: async (request: PairConfigCreateRequest) => {
    const response = await apiClient.post<PairConfigCreateResponse>(
      API_ROUTES.PAIR_CONFIGS.CREATE,
      request,
    );
    return response;
  },
  updatePairConfig: async (request: PairConfigUpdateRequest) => {
    const { tokenIn, tokenOut, ...rest } = request;
    const response = await apiClient.patch<PairConfigUpdateResponse>(
      API_ROUTES.PAIR_CONFIGS.UPDATE(tokenIn, tokenOut),
      rest,
    );
    return response;
  },
  listPairConfigs: async (request: PairConfigListRequest) => {
    const response = await apiClient.get<PairConfigListResponse>(
      API_ROUTES.PAIR_CONFIGS.LIST,
      {
        params: request,
      },
    );
    return response;
  },
  detailPairConfig: async (request: PairConfigDetailRequest) => {
    const response = await apiClient.get<PairConfigDetailResponse>(
      API_ROUTES.PAIR_CONFIGS.DETAIL(request.tokenIn, request.tokenOut),
      {
        param: {
          chainId: request.chainId,
        },
      },
    );
    return response;
  },
  deletePairConfig: async (request: PairConfigDeleteRequest) => {
    const response = await apiClient.delete<PairConfigDeleteResponse>(
      API_ROUTES.PAIR_CONFIGS.DELETE(request.tokenIn, request.tokenOut),
    );
    return response;
  },
};
