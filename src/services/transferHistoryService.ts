import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type { PaginationResponse } from "@/types/common";

// ─── Analysis types (used by stat cards in header) ────────────────────────────
export interface AnalysisItem {
  chainId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  totalAmount: string;
  txnCount: number;
}

export interface GetTransferAnalysisResponse {
  analysis: AnalysisItem[];
}

// ─── Transfer history list types ─────────────────────────────────────────────
export interface TransferRecord {
  poolName: string | null;
  chainId: string;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals?: number | null;
  amountOut: string;
  timestamp: string; // unix timestamp in milliseconds
  whitelistName: string | null;
  whitelistEmail: string | null;
  recipient: string | null;
}

export interface GetTransferHistoryRequest {
  page?: number;
  limit?: number;
  chainIds?: string; // comma-separated backend chain IDs
  tokens?: string;   // comma-separated token addresses
  search?: string;
  amountMin?: string;
  amountMax?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}

export interface GetTransferHistoryResponse extends PaginationResponse {
  transfers: TransferRecord[];
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const transferHistoryService = {
  getHistory: async (params?: GetTransferHistoryRequest): Promise<GetTransferHistoryResponse> => {
    const response = await apiClient.get<GetTransferHistoryResponse>(
      API_ROUTES.TRANSFER_HISTORY.LIST,
      { params },
    );
    return response;
  },

  getAnalysis: async (): Promise<GetTransferAnalysisResponse> => {
    const response = await apiClient.get<GetTransferAnalysisResponse>(
      API_ROUTES.TRANSFER_HISTORY.ANALYSIS,
    );
    return response;
  },
};
