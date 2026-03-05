// 0 - burn pool
// 1 - swap pool
export const poolTypes = [0, 1] as const;
export type PoolType = (typeof poolTypes)[number];
export const poolTypeLabels: Record<PoolType, string> = {
  0: "Burn pool",
  1: "Swap pool",
};

export const poolTypeOptionValues = [
  "all",
  ...poolTypes.map((type) => type.toString()),
];
export type PoolTypeOptionValue = (typeof poolTypeOptionValues)[number];
export const poolTypeOptions = poolTypeOptionValues.map((value) => {
  if (value === "all") return { label: "All Types", value };
  return {
    label: poolTypeLabels[Number(value) as PoolType],
    value,
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
