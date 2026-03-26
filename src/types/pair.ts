import type {
  PaginationRequest,
  PaginationResponse,
  SortBy,
  SortOrder,
} from "./common";

export type PairItemType = {
  chainId: string;
  volume: string; // string number
  tvl: string; // string number
  tokenIn: string;
  tokenInSymbol: string;
  tokenInDecimals: number;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals: number;
  tokenInSymbolCustom: string | null;
  tokenOutSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOutImageUri: string | null;
  liquidity: string; // string number
};

export type PairListRequest = PaginationRequest & {
  chainIds?: string; // comma separated
  search?: string;
  sortBy?: SortBy; // default to volume
  sortDirection?: SortOrder; // default to desc
};

export type PairListResponse = PaginationResponse & {
  pairs: PairItemType[];
};

export type PairDetailStatsRequest = {
  chainId: string;
  tokenIn: string;
  tokenOut: string;
};

export type PairDetailStatsResponse = {
  totalPools: number;
  totalPaticipants: number;
  pair: PairItemType;
};

export type PairOverallStatsResponse = {
  stats: {
    totalPairs: number;
    totalParticipants: number;
    totalVolume: string; // string number
    totalTransactions: number;
  };
};

export type PairDetailRequest = {
  chainId: string;
  tokenIn: string;
  tokenOut: string;
};

export type PairDetailResponse = {
  pair: PairItemType;
};
