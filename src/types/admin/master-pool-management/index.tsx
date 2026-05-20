import type {
  BooleanString,
  PaginationRequest,
  PaginationResponse,
  SortBy,
  SortOrder,
} from "@/types/common";

// 0 - burn pool | 1 - swap pool | 2 - stake pool | 3 - launchpad
export const poolTypes = [0, 1, 2, 3] as const;
export type PoolType = (typeof poolTypes)[number];
export const poolTypeLabels: Record<PoolType, string> = {
  0: "Burn pool",
  1: "Swap pool",
  2: "Stake pool",
  3: "Launchpad",
};

export const adminPoolTypeLabels: Record<PoolType, string> = {
  0: "Burn",
  1: "Swap",
  2: "Stake",
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

export const adminPoolTypeShortenOptions = poolTypes.map((type) => {
  return {
    label: adminPoolTypeLabels[type],
    value: type.toString(),
  };
});

export const launchpadModes = ["fixed", "dynamic"] as const; // TODO: subject to change
export type LaunchpadMode = (typeof launchpadModes)[number];
export const launchpadModeLabels: Record<LaunchpadMode, string> = {
  fixed: "Fixed",
  dynamic: "Dynamic",
};

export const swapPoolStatuses = [
  "on_going",
  "canceled",
  "closed",
  "ended",
] as const;
export type SwapPoolStatus = (typeof swapPoolStatuses)[number];
export const swapPoolStatusLabels: Record<SwapPoolStatus, string> = {
  on_going: "Ongoing",
  ended: "Ended",
  canceled: "Canceled",
  closed: "Closed",
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

export const stakePoolStatuses = [
  "holding",
  "upcoming",
  ...swapPoolStatuses,
  "full",
] as const;
export type StakePoolStatus = (typeof stakePoolStatuses)[number];
export const stakePoolStatusLabels: Record<StakePoolStatus, string> = {
  ...swapPoolStatusLabels,
  holding: "Holding",
  upcoming: "Upcoming",
  full: "Full",
};
export const stakePoolStatusColors: Record<StakePoolStatus, string> = {
  ...swapPoolStatusColors,
  holding: "#FFB08E",
  upcoming: "#FFE798",
  full: "#FFB08E",
};

export const launchpadPoolStatuses = [
  "upcoming",
  "completed",
  ...swapPoolStatuses,
] as const;
export type LaunchpadPoolStatus = (typeof launchpadPoolStatuses)[number];
export const launchpadPoolStatusLabels: Record<LaunchpadPoolStatus, string> = {
  ...swapPoolStatusLabels,
  upcoming: "Upcoming",
  completed: "Completed",
};
export const launchpadPoolStatusColors: Record<LaunchpadPoolStatus, string> = {
  ...swapPoolStatusColors,
  upcoming: "#FFE798",
  completed: "#8EEAFF",
};

export const getPoolStatusColor = (status: AllPoolStatus) => {
  return allPoolStatusColors[status as AllPoolStatus] ?? "#7989ba";
};
export const getPoolStatusLabel = (status: AllPoolStatus) => {
  return allPoolStatusLabels[status as AllPoolStatus] ?? "N/A";
};

export type AllPoolStatus =
  | BurnPoolStatus
  | SwapPoolStatus
  | StakePoolStatus
  | LaunchpadPoolStatus
  | "draft";

// draft is not included in this list because when it is used is situational
export const allPoolStatuses: AllPoolStatus[] = Array.from(
  new Set([...burnPoolStatuses, ...swapPoolStatuses, ...stakePoolStatuses, ...launchpadPoolStatuses]),
);
export const allPoolStatusLabels: Record<AllPoolStatus, string> = {
  ...burnPoolStatusLabels,
  ...swapPoolStatusLabels,
  ...stakePoolStatusLabels,
  ...launchpadPoolStatusLabels,
  draft: "Draft",
};
export const allPoolStatusColors: Record<AllPoolStatus, string> = {
  ...burnPoolStatusColors,
  ...swapPoolStatusColors,
  ...stakePoolStatusColors,
  ...launchpadPoolStatusColors,
  draft: "#7989ba",
};

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
  lowRewardNotiEnabled: boolean;
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
