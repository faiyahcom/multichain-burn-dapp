import type { BurnPoolStatus, SwapPoolStatus } from "@/types/pool";

export const tokenStatus = ["all", "enable", "disable"] as const;
export type TokenStatus = (typeof tokenStatus)[number];
export const tokenStatusLabels: Record<TokenStatus, string> = {
  all: "All",
  enable: "Active",
  disable: "Disabled",
};
export const tokenStatusLetters: Record<TokenStatus, string> = {
  all: "",
  enable: "A",
  disable: "D",
};
export const tokenStatusColors: Record<TokenStatus, string> = {
  all: "",
  enable: "#7af4cb",
  disable: "#ff8e97",
};
export const booleanToTokenStatus = (value: boolean): TokenStatus =>
  value ? "enable" : "disable";

export const SWAP_POOL_STATUS: Record<SwapPoolStatus, any> = {
  // "on_going" | "canceled" | "closed"
  on_going: {
    label: "Ongoing",
    color: "#7af4cb",
    letter: "O",
  },
  canceled: {
    label: "Cancel",
    color: "#f698ff",
    letter: "C",
  },
  closed: {
    label: "Close",
    color: "#8eeaff",
    letter: "C",
  },
  draft: {
    label: "Draft",
    color: "#C2C2C2",
    letter: "D",
  },
  ended: {
    label: "End",
    color: "#A6B7FF",
    letter: "E",
  },
};

export const BURN_POOL_STATUS: Record<BurnPoolStatus, any> = {
  // "on_going" | "canceled" | "closed" | "draft" | "pending" | "upcoming" | "holding" | "end"
  ...SWAP_POOL_STATUS,
  pending: {
    label: "Pending",
    color: "#FF8E97",
    letter: "P",
  },
  upcoming: {
    label: "Upcoming",
    color: "#FFC198",
    letter: "U",
  },
  holding: {
    label: "Holding",
    color: "#FFB08E",
    letter: "H",
  },
};
