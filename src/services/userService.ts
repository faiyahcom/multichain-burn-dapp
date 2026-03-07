import { apiClient } from '@/config/axios'
import { API_ROUTES } from '@/services/apiRoutes'
import type { AllPoolStatus } from '@/types/admin/master-pool-management';
import type {  PaginationResponse, SortOrder } from '@/types/common';

const USERS_API_ROUTES = API_ROUTES.USERS

export interface GetParticipatedPoolsByUserParams {
  page: number,
  limit: number,
  includeStatuses?: string; // comma separated
  chainIds?: string; // comma separated
  kind?: string;
  search?: string;
  sortBy?: "tvl" | "joinedTime" | "amountBurned" | "claimableReward"; 
  sortDirection?: SortOrder; // default to desc
  tokenIn?: string;
  tokenReward?: string;
}

interface ParticipatedUserPool {
  address: string
  chainId: string
  name: string

  owner: string
  timeStart: string
  timeEnd: string

  status: AllPoolStatus

  volume: string
  tvl: string

  tokenIn: string
  tokenInSymbol: string
  tokenInDecimals: number

  tokenOut: string
  tokenOutSymbol: string
  tokenOutDecimals: number

  kind: number
  timestamp: string

  rewardNumerator:string,
  rewardDenominator:string

  tokenInSymbolCustom?: string | null
  tokenOutSymbolCustom?: string | null
  tokenInImageUri?: string | null
  tokenOutImageUri?: string | null

  participant: string
  amountBurned: string
  claimableReward: string
  joinedTime: string
}

export const userService = {
  getParticipatedPoolsByUser: async (
    params: GetParticipatedPoolsByUserParams,
  ) => {
    const response = await apiClient.get<PaginationResponse & {pools: ParticipatedUserPool[]}>(
      USERS_API_ROUTES.GET_PARTICIPATED_POOLS,
      {params},
    )
    return response
  }
}
