import { apiClient } from "@/config/axios";
import type {
  AllPoolStatus,
  LaunchpadMode,
  PoolType,
} from "@/types/admin/master-pool-management";
import type {
  BooleanString,
  PaginationRequest,
  PaginationResponse,
  SortBy,
  SortOrder,
} from "@/types/common";
import { API_ROUTES } from "./apiRoutes";

export type AdminPoolItemType = {
  address: string;
  name: string;
  timestamp: string; // string unix seconds
  chainId: string;
  status: AllPoolStatus;
  kind: PoolType;
  tokenIn: string; // token address
  tokenInSymbol: string;
  tokenInSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOut: string; // token address
  tokenOutSymbol: string;
  tokenOutSymbolCustom: string | null;
  tokenOutImageUri: string | null;
  timeStart: string; // string unix seconds
  timeEnd: string; // string unix seconds
  isPartner: boolean | null;
  lowRewardNotiEnabled: boolean | null;
  joinedUsersCount: string; // string number
  burnedAmount: string | null; // string number
  swappedAmount: string | null; // string number
  stakedAmount: string; // string number
  raiseAmount: string | null; // string number
  rewardDenominator: string | null; // string number
  rewardNumerator: string | null; // string number
};

export interface AdminPoolListRequest extends PaginationRequest {
  chainIds?: string; // comma separated
  statuses?: string; // comma separated
  excludeStatuses?: string; // comma separated
  kind?: string;
  tokens?: string; // comma separated
  timeStartFrom?: number; // unix seconds
  timeStartTo?: number; // unix seconds
  timeEndFrom?: number; // unix seconds
  timeEndTo?: number; // unix seconds
  timestampFrom?: number; // unix seconds
  timestampTo?: number; // unix seconds
  isPartner?: BooleanString; // burn pool only
  lowRewardNotiEnabled?: BooleanString; // stake pool only
  search?: string;
  sortBy?: SortBy; // default to timestamp
  sortDirection?: SortOrder; // default to desc
  mode?: LaunchpadMode; // default to all
}

export interface AdminPoolListResponse extends PaginationResponse {
  pools: AdminPoolItemType[];
}

export const adminPoolManagementService = {
  getList: async (request?: AdminPoolListRequest) => {
    const response = await apiClient.get<AdminPoolListResponse>(
      `${API_ROUTES.ADMINS.POOL_LIST}`,
      {
        params: {
          ...request,
        },
      },
    );
    return response;
  },
};
