import type {
  BooleanString,
  PaginationRequest,
  PaginationResponse,
  SortBy,
  SortOrder,
} from "@/types/common";

// 0 - burn pool | 1 - swap pool
export const poolTypes = [0, 1, 2, 3] as const;
export type PoolType = (typeof poolTypes)[number];
export const poolTypeLabels: Record<PoolType, string> = {
  0: "Burn pool",
  1: "Swap pool",
  2: "Stake pool",
  3: "Launchpad",
};

export const poolTypeOptionValues = [
  "all",
  ...poolTypes.map((type) => type.toString()),
  "partner",
];
export type PoolTypeOptionValue = (typeof poolTypeOptionValues)[number];
export const poolTypeOptions = poolTypeOptionValues.map((value) => {
  if (value === "all") return { label: "All Types", value };
  if (value === "partner") return { label: "Partner Burn", value };
  return {
    label: poolTypeLabels[Number(value) as PoolType],
    value,
  };
});
export const poolTypeShortenOptions = poolTypes.map((type) => {
  return {
    label: poolTypeLabels[type],
    value: type.toString(),
  };
});

export const swapPoolStatuses = [
  "on_going",
  "canceled",
  "closed",
  "ended",
] as const;
export type SwapPoolStatus = (typeof swapPoolStatuses)[number];
export const swapPoolStatusLabels: Record<SwapPoolStatus, string> = {
  on_going: "Ongoing",
  ended: "End",
  canceled: "Cancel",
  closed: "Close",
};
export const swapPoolStatusColors: Record<SwapPoolStatus, string> = {
  on_going: "#7AF4CB",
  ended: "#A6B7FF",
  canceled: "#FF8E8E",
  closed: "#8EEAFF",
};

export const burnPoolStatuses = [
  "pending",
  "holding",
  "upcoming",
  ...swapPoolStatuses,
] as const;
export type BurnPoolStatus = (typeof burnPoolStatuses)[number];
export const burnPoolStatusLabels: Record<BurnPoolStatus, string> = {
  ...swapPoolStatusLabels,
  pending: "Pending",
  holding: "Holding",
  upcoming: "Upcoming",
};
export const burnPoolStatusColors: Record<BurnPoolStatus, string> = {
  ...swapPoolStatusColors,
  pending: "#FF8E97",
  holding: "#FFB08E",
  upcoming: "#FFE798",
};

export const getPoolStatusColor = (status: AllPoolStatus) => {
  return burnPoolStatusColors[status as BurnPoolStatus] ?? "#7989ba";
};
export const getPoolStatusLabel = (status: AllPoolStatus) => {
  if (status === "draft") return "Draft";
  return burnPoolStatusLabels[status as BurnPoolStatus] ?? "N/A";
};

export type AllPoolStatus = BurnPoolStatus | SwapPoolStatus | "draft";

export type PoolItemType = {
  address: string;
  chainId: string;
  name: string;
  status: AllPoolStatus;
  volume: string; // string number
  tvl: string; // string number
  budget: string; // string number
  tokenIn: string;
  tokenInSymbol: string;
  tokenInDecimals: number;
  tokenOut: string;
  tokenOutSymbol: string;
  tokenOutDecimals: number;
  kind: PoolType;
  timestamp: string;
  tokenInSymbolCustom: string | null;
  tokenOutSymbolCustom: string | null;
  tokenInImageUri: string | null;
  tokenOutImageUri: string | null;
  owner: string;
  timeStart: string; // timestamp seconds, if none then it is "0"
  timeEnd: string; // timestamp seconds, if none then it is "0"
  rewardNumerator: string;
  rewardDenominator: string;
  isPartner: boolean;
};

export type PoolListRequest = PaginationRequest & {
  excludeStatuses?: string; // comma separated
  includeStatuses?: string; // comma separated
  chainIds?: string; // comma separated
  kind?: string;
  search?: string;
  sortBy?: SortBy; // default to timestamp
  sortDirection?: SortOrder; // default to desc
  tokenIn?: string;
  tokenReward?: string;
  owner?: string;
  isPartner?: BooleanString;
};

export type PoolListResponse = PaginationResponse & {
  pools: PoolItemType[];
};

// user view pool list can only see certain statuses
export const userViewBurnPoolStatuses = [
  "pending",
  "holding",
  "upcoming",
  "on_going",
  "ended",
] as const;
export type UserViewBurnPoolStatus = (typeof userViewBurnPoolStatuses)[number];
export const userHiddenBurnPoolStatuses = [
  ...burnPoolStatuses.filter(
    (status) =>
      !(userViewBurnPoolStatuses as ReadonlyArray<BurnPoolStatus>).includes(
        status,
      ),
  ),
  "draft",
] as const;

export const userViewSwapPoolStatuses = ["on_going"] as const;
export const userHiddenSwapPoolStatuses = [
  ...swapPoolStatuses.filter(
    (status) =>
      !(userViewSwapPoolStatuses as ReadonlyArray<SwapPoolStatus>).includes(
        status,
      ),
  ),
  "draft",
] as const;
