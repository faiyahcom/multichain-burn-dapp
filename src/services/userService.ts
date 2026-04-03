import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  AllPoolStatus,
  PoolType,
} from "@/types/admin/master-pool-management";
import type {
  BooleanString,
  PaginationRequest,
  PaginationResponse,
  SortBy,
  SortOrder,
} from "@/types/common";
import type { ActivityKindKey } from "@/types/pool";

const USERS_API_ROUTES = API_ROUTES.USERS;

export interface GetParticipatedPoolsByUserParams {
  page: number;
  limit: number;
  includeStatuses?: string; // comma separated
  chainIds?: string; // comma separated
  kind?: string;
  search?: string;
  sortBy?: SortBy;
  sortDirection?: SortOrder; // default to desc
  tokenIn?: string;
  tokenReward?: string;
  onlyUnClaimed?: BooleanString;
}

export interface ParticipatedUserPool {
  address: string;
  chainId: string;
  name: string;

  owner: string;
  timeStart: string;
  timeEnd: string;

  status: AllPoolStatus;

  volume: string;
  tvl: string;

  tokenIn: string;
  tokenInSymbol: string;
  tokenInDecimals: number;

  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals: number;

  kind: number;
  timestamp: string;

  rewardNumerator: string;
  rewardDenominator: string;

  tokenInSymbolCustom: string | null;
  tokenOutSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOutImageUri: string | null;

  participant: string;
  amountBurned: string;
  claimableReward: string;
  joinedTime: string;

  // Added to match PoolItemType
  isPartner: boolean;
  liquidity: string; // string number
  rewardAmount: string; // string number
}

export type ParticipatedPoolsResponse = PaginationResponse & {
  pools: ParticipatedUserPool[];
};

export interface PoolMerkleProofResponse {
  pool: string;
  to: string;
  merkleProof: string[];
  proofIndex: number;
}

export interface GetUserActivitiesRequest extends PaginationRequest {
  search?: string;
  kinds?: string; // comma separated
}

export interface UserActivityType {
  id: string;
  hash: string;
  log_ix: number;
  timestamp: string; // timestamp in seconds
  actor: string; // address
  kind: ActivityKindKey;
  poolAddress: string;
  poolKind: PoolType;
  uiAmountIn: string;
  uiAmountOut: string;
  pool: {
    address: string;
    name: string;
    tokenIn: string;
    rewardToken: string;
    tokenInSymbol: string;
    rewardTokenSymbol: string;
  } | null;
}

export interface GetUserActivitiesResponse extends PaginationResponse {
  activities: UserActivityType[];
}

export const userService = {
  getParticipatedPoolsByUser: async (
    params: GetParticipatedPoolsByUserParams,
  ) => {
    const response = await apiClient.get<ParticipatedPoolsResponse>(
      USERS_API_ROUTES.GET_PARTICIPATED_POOLS,
      { params },
    );
    return response;
  },

  getPoolMerkleProof: async (poolAddress: string) => {
    const response = await apiClient.get<PoolMerkleProofResponse>(
      USERS_API_ROUTES.GET_POOL_MERKLE_PROOF(poolAddress),
    );
    return response;
  },

  getUserActivities: async (params: GetUserActivitiesRequest) => {
    const response = await apiClient.get<GetUserActivitiesResponse>(
      USERS_API_ROUTES.ACTIVITIES,
      {
        params,
      },
    );
    return response;
  },
};
