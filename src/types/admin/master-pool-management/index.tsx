// 0 - burn pool
// 1 - swap pool
export const poolTypes = [0, 1] as const;
export type PoolType = (typeof poolTypes)[number];
export const poolTypeLabels: Record<PoolType, string> = {
  0: "Burn pool",
  1: "Swap pool",
};

export const swapPoolStatuses = [
  "on_going",
  "ended",
  "canceled",
  "closed",
] as const;
export type SwapPoolStatus = (typeof swapPoolStatuses)[number];

/*
pending, holding, upcoming, on_going, canceled, closed, ended
*/
export const burnPoolStatuses = [
  ...swapPoolStatuses,
  "pending",
  "holding",
  "upcoming",
] as const;
export type BurnPoolStatus = (typeof burnPoolStatuses)[number];
