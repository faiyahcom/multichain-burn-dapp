import type { PoolStatus } from "@/types/pool";

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
export const tokenStatusToBoolean = (value: TokenStatus): boolean =>
  value === "enable";

export const POOL_STATUS: Record<PoolStatus, any> = {
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
};
