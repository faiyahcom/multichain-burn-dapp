import type { PoolStatus } from "@/types/pool";

export const tokenStatus = ["all", "enabled", "disabled"] as const;
export type TokenStatus = (typeof tokenStatus)[number];
export const tokenStatusLabels: Record<TokenStatus, string> = {
  all: "All",
  enabled: "Active",
  disabled: "Disabled",
};
export const tokenStatusLetters: Record<TokenStatus, string> = {
  all: "",
  enabled: "A",
  disabled: "D",
};
export const tokenStatusColors: Record<TokenStatus, string> = {
  all: "",
  enabled: "#7af4cb",
  disabled: "#ff8e97",
};
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
